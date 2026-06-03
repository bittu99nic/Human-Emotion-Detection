import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from backend.config import DEVICE, FACE_MODEL_PATH
from backend.ai_models.face_model import FaceEmotionCNN, export_face_to_onnx

PREPROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "preprocessed"))
FACE_FEATURES_PATH = os.path.join(PREPROCESSED_DIR, "face_features.npz")

def run_training(epochs=10, batch_size=8, lr=0.001):
    print("[AURA FACE TRAIN] Starting face model training...")
    
    # Check if preprocessed dataset exists, otherwise generate synthetic dataset
    if not os.path.exists(FACE_FEATURES_PATH):
        print("[AURA FACE TRAIN] Preprocessed face dataset not found. Triggering automated dataset setup...")
        from backend.training.download_datasets import main as dl_main
        from backend.training.preprocess import preprocess_facial
        dl_main()
        preprocess_facial()
        
    if not os.path.exists(FACE_FEATURES_PATH):
        raise FileNotFoundError(f"Failed to find or generate face dataset at {FACE_FEATURES_PATH}")
        
    data = np.load(FACE_FEATURES_PATH)
    X = torch.tensor(data["X"], dtype=torch.float32)
    y = torch.tensor(data["y"], dtype=torch.long)
    
    print(f"[AURA FACE TRAIN] Loaded {len(X)} face samples. Split: Train/Val.")
    
    # Train/Val split (80/20)
    dataset = TensorDataset(X, y)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = FaceEmotionCNN().to(DEVICE)
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
        
        print(f"[AURA FACE TRAIN] Epoch {epoch:02d}/{epochs:02d} | Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}")
        
        # Save best checkpoint
        if val_epoch_acc >= best_acc:
            best_acc = val_epoch_acc
            os.makedirs(os.path.dirname(FACE_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), FACE_MODEL_PATH)
            print(f"[AURA FACE TRAIN] Saved best model to {FACE_MODEL_PATH} with Val Acc: {best_acc:.4f}")
            
    # Load best weights & export to ONNX
    model.load_state_dict(torch.load(FACE_MODEL_PATH))
    export_face_to_onnx(model)
    print("[AURA FACE TRAIN] Training completed and ONNX exported.")

if __name__ == "__main__":
    run_training(epochs=5, batch_size=4)
