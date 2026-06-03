import torch
import torch.nn as nn
import torch.nn.functional as F
import os
from backend.config import DEVICE, FACE_MODEL_PATH, FACE_ONNX_PATH, NUM_EMOTIONS

class FaceEmotionCNN(nn.Module):
    def __init__(self, num_classes=NUM_EMOTIONS):
        super(FaceEmotionCNN, self).__init__()
        # Conv block 1
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        
        # Conv block 2
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.conv4 = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(128)
        
        # FC layers
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout1 = nn.Dropout(0.25)
        self.dropout2 = nn.Dropout(0.5)
        
        # Input size: 1 x 48 x 48
        # After 1st pool: 64 x 24 x 24
        # After 2nd pool: 128 x 12
        # After 3rd pool: 128 x 6 x 6
        self.fc1 = nn.Linear(128 * 6 * 6, 256)
        self.fc2 = nn.Linear(256, num_classes)
        
    def forward(self, x):
        # Block 1
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        x = self.dropout1(x)
        
        # Block 2
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.relu(self.bn4(self.conv4(x)))
        x = self.pool(x)
        x = self.pool(x)
        x = self.dropout1(x)
        
        # Flatten
        x = x.view(-1, 128 * 6 * 6)
        
        # FC
        x = F.relu(self.fc1(x))
        x = self.dropout2(x)
        x = self.fc2(x)
        return x

def get_face_model(pretrained=True):
    model = FaceEmotionCNN().to(DEVICE)
    if pretrained:
        if os.path.exists(FACE_MODEL_PATH):
            try:
                model.load_state_dict(torch.load(FACE_MODEL_PATH, map_location=DEVICE))
                print(f"[AURA FACE MODEL] Loaded checkpoint from {FACE_MODEL_PATH}")
            except Exception as e:
                print(f"[AURA FACE MODEL] Error loading checkpoint: {e}. Using random weights.")
        else:
            print(f"[AURA FACE MODEL] Checkpoint not found at {FACE_MODEL_PATH}. Initializing default weights.")
            # Auto-save random weights so the file exists and is ready
            os.makedirs(os.path.dirname(FACE_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), FACE_MODEL_PATH)
            export_face_to_onnx(model)
    return model

def export_face_to_onnx(model=None):
    if model is None:
        model = get_face_model(pretrained=False)
    model.eval()
    dummy_input = torch.randn(1, 1, 48, 48, device=DEVICE)
    os.makedirs(os.path.dirname(FACE_ONNX_PATH), exist_ok=True)
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(FACE_ONNX_PATH),
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
            opset_version=11
        )
        print(f"[AURA FACE MODEL] Exported ONNX model to {FACE_ONNX_PATH}")
    except Exception as e:
        print(f"[AURA FACE MODEL] Failed to export ONNX: {e}")

if __name__ == "__main__":
    m = get_face_model(pretrained=False)
    export_face_to_onnx(m)
