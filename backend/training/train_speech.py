import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from backend.config import DEVICE, SPEECH_MODEL_PATH
from backend.ai_models.speech_model import SpeechEmotionMLP, export_speech_to_onnx

PREPROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "preprocessed"))
SPEECH_FEATURES_PATH = os.path.join(PREPROCESSED_DIR, "speech_features.npz")

def run_training(epochs=10, batch_size=8, lr=0.001):
    print("[AURA SPEECH TRAIN] Starting speech model training...")
    
    # Check if preprocessed dataset exists, otherwise generate synthetic dataset
    if not os.path.exists(SPEECH_FEATURES_PATH):
        print("[AURA SPEECH TRAIN] Preprocessed speech dataset not found. Triggering automated dataset setup...")
        from backend.training.download_datasets import main as dl_main
        from backend.training.preprocess import preprocess_speech
        dl_main()
        preprocess_speech()
        
    if not os.path.exists(SPEECH_FEATURES_PATH):
        raise FileNotFoundError(f"Failed to find or generate speech dataset at {SPEECH_FEATURES_PATH}")
        
    data = np.load(SPEECH_FEATURES_PATH)
    X = torch.tensor(data["X"], dtype=torch.float32)
    y = torch.tensor(data["y"], dtype=torch.long)
    
    print(f"[AURA SPEECH TRAIN] Loaded {len(X)} speech samples. Split: Train/Val.")
    
    # Train/Val split (80/20)
    dataset = TensorDataset(X, y)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = SpeechEmotionMLP().to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    best_acc = 0.0
    
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(DEVICE), batch_y.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * batch_x.size(0)
            _, predicted = torch.max(outputs, 1)
            total += batch_y.size(0)
            correct += (predicted == batch_y).sum().item()
            
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(DEVICE), batch_y.to(DEVICE)
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                
                val_loss += loss.item() * batch_x.size(0)
                _, predicted = torch.max(outputs, 1)
                val_total += batch_y.size(0)
                val_correct += (predicted == batch_y).sum().item()
                
        val_epoch_loss = val_loss / len(val_loader.dataset)
        val_epoch_acc = val_correct / val_total
        
        print(f"[AURA SPEECH TRAIN] Epoch {epoch:02d}/{epochs:02d} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
        
        # Save best checkpoint
        if val_epoch_acc >= best_acc:
            best_acc = val_epoch_acc
            os.makedirs(os.path.dirname(SPEECH_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), SPEECH_MODEL_PATH)
            print(f"[AURA SPEECH TRAIN] Saved best model to {SPEECH_MODEL_PATH} with Val Acc: {best_acc:.4f}")
            
    # Load best weights & export to ONNX
    model.load_state_dict(torch.load(SPEECH_MODEL_PATH))
    export_speech_to_onnx(model)
    print("[AURA SPEECH TRAIN] Training completed and ONNX exported.")

if __name__ == "__main__":
    run_training(epochs=5, batch_size=4)
