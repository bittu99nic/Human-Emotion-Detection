import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from backend.config import DEVICE, FUSION_MODEL_PATH, EMOTIONS
from backend.ai_models.fusion_model import MultimodalFusionNet, export_fusion_to_onnx

def generate_fusion_dataset(num_samples=1000):
    """
    Generates a synthetic paired dataset for training the Fusion model.
    Contains face probabilities, speech probabilities, ground truth emotion,
    intensity, stress, and engagement indicators.
    """
    # 7 Classes: ["happy", "sad", "angry", "fear", "surprise", "neutral", "disgust"]
    # Indexes:     0        1       2        3        4           5          6
    
    np.random.seed(42)
    face_probs_list = []
    speech_probs_list = []
    y_class = []
    y_intensity = []
    y_stress = []
    y_engagement = []
    
    for _ in range(num_samples):
        # Choose a random true emotion
        true_emotion_idx = np.random.randint(0, len(EMOTIONS))
        
        # 1. Simulate Face Probabilities
        face = np.random.dirichlet(np.ones(7) * 0.5) # Sparse vector
        # Boost the probability of the true emotion
        face[true_emotion_idx] += np.random.uniform(0.5, 1.5)
        # Normalize
        face = face / np.sum(face)
        
        # 2. Simulate Speech Probabilities
        speech = np.random.dirichlet(np.ones(7) * 0.5)
        # Boost the probability of the true emotion
        speech[true_emotion_idx] += np.random.uniform(0.5, 1.5)
        # Normalize
        speech = speech / np.sum(speech)
        
        # Occasional sensor mismatch (20% of times face and speech don't match)
        if np.random.uniform() < 0.20:
            wrong_idx = np.random.randint(0, len(EMOTIONS))
            speech = np.random.dirichlet(np.ones(7) * 0.5)
            speech[wrong_idx] += np.random.uniform(0.5, 1.5)
            speech = speech / np.sum(speech)
            
        # Determine continuous targets based on simulated emotional profile
        # Happy: low stress, high engagement, high intensity
        if true_emotion_idx == 0: # happy
            intensity = np.random.uniform(0.6, 0.9)
            stress = np.random.uniform(0.05, 0.25)
            engagement = np.random.uniform(0.7, 0.95)
        elif true_emotion_idx == 1: # sad
            intensity = np.random.uniform(0.3, 0.6)
            stress = np.random.uniform(0.5, 0.85)
            engagement = np.random.uniform(0.1, 0.4)
        elif true_emotion_idx == 2: # angry
            intensity = np.random.uniform(0.7, 0.95)
            stress = np.random.uniform(0.75, 0.98)
            engagement = np.random.uniform(0.5, 0.8)
        elif true_emotion_idx == 3: # fear
            intensity = np.random.uniform(0.6, 0.9)
            stress = np.random.uniform(0.8, 0.99)
            engagement = np.random.uniform(0.4, 0.7)
        elif true_emotion_idx == 4: # surprise
            intensity = np.random.uniform(0.7, 0.9)
            stress = np.random.uniform(0.2, 0.5)
            engagement = np.random.uniform(0.75, 0.95)
        elif true_emotion_idx == 5: # neutral
            intensity = np.random.uniform(0.1, 0.3)
            stress = np.random.uniform(0.1, 0.3)
            engagement = np.random.uniform(0.4, 0.6)
        else: # disgust
            intensity = np.random.uniform(0.5, 0.75)
            stress = np.random.uniform(0.4, 0.7)
            engagement = np.random.uniform(0.3, 0.6)
            
        face_probs_list.append(face)
        speech_probs_list.append(speech)
        y_class.append(true_emotion_idx)
        y_intensity.append([intensity])
        y_stress.append([stress])
        y_engagement.append([engagement])
        
    return (
        torch.tensor(np.array(face_probs_list), dtype=torch.float32),
        torch.tensor(np.array(speech_probs_list), dtype=torch.float32),
        torch.tensor(np.array(y_class), dtype=torch.long),
        torch.tensor(np.array(y_intensity), dtype=torch.float32),
        torch.tensor(np.array(y_stress), dtype=torch.float32),
        torch.tensor(np.array(y_engagement), dtype=torch.float32),
    )

def run_training(epochs=15, batch_size=16, lr=0.005):
    print("[AURA FUSION TRAIN] Generating training data...")
    face_in, speech_in, classes, intensities, stresses, engagements = generate_fusion_dataset(1500)
    
    dataset = TensorDataset(face_in, speech_in, classes, intensities, stresses, engagements)
    
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = MultimodalFusionNet().to(DEVICE)
    
    # Losses
    ce_loss = nn.CrossEntropyLoss()
    mse_loss = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    print(f"[AURA FUSION TRAIN] Training fusion layer over {epochs} epochs...")
    
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        
        for f, s, cls, intensity, stress, eng in train_loader:
            f, s = f.to(DEVICE), s.to(DEVICE)
            cls, intensity, stress, eng = cls.to(DEVICE), intensity.to(DEVICE), stress.to(DEVICE), eng.to(DEVICE)
            
            optimizer.zero_grad()
            emotion_logits, pred_intensity, pred_stress, pred_eng = model(f, s)
            
            loss_c = ce_loss(emotion_logits, cls)
            loss_i = mse_loss(pred_intensity, intensity)
            loss_s = mse_loss(pred_stress, stress)
            loss_e = mse_loss(pred_eng, eng)
            
            # Combine losses
            loss = loss_c + loss_i + loss_s + loss_e
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * f.size(0)
            _, predicted = torch.max(emotion_logits, 1)
            total += cls.size(0)
            correct += (predicted == cls).sum().item()
            
        epoch_loss = train_loss / len(train_loader.dataset)
        epoch_acc = correct / total
        
        # Validation loop
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for f, s, cls, intensity, stress, eng in val_loader:
                f, s = f.to(DEVICE), s.to(DEVICE)
                cls, intensity, stress, eng = cls.to(DEVICE), intensity.to(DEVICE), stress.to(DEVICE), eng.to(DEVICE)
                
                emotion_logits, pred_intensity, pred_stress, pred_eng = model(f, s)
                loss_c = ce_loss(emotion_logits, cls)
                loss_i = mse_loss(pred_intensity, intensity)
                loss_s = mse_loss(pred_stress, stress)
                loss_e = mse_loss(pred_eng, eng)
                
                loss = loss_c + loss_i + loss_s + loss_e
                val_loss += loss.item() * f.size(0)
                
                _, predicted = torch.max(emotion_logits, 1)
                val_total += cls.size(0)
                val_correct += (predicted == cls).sum().item()
                
        val_epoch_loss = val_loss / len(val_loader.dataset)
        val_epoch_acc = val_correct / val_total
        
        print(f"[AURA FUSION TRAIN] Epoch {epoch:02d}/{epochs:02d} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
        
    os.makedirs(os.path.dirname(FUSION_MODEL_PATH), exist_ok=True)
    torch.save(model.state_dict(), FUSION_MODEL_PATH)
    print(f"[AURA FUSION TRAIN] Saved checkpoint to {FUSION_MODEL_PATH}")
    
    export_fusion_to_onnx(model)
    print("[AURA FUSION TRAIN] Exported ONNX model.")

if __name__ == "__main__":
    run_training(epochs=5, batch_size=8)
