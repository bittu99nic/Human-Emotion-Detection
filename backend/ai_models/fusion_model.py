import torch
import torch.nn as nn
import torch.nn.functional as F
import os
from backend.config import DEVICE, FUSION_MODEL_PATH, FUSION_ONNX_PATH, NUM_EMOTIONS

class MultimodalFusionNet(nn.Module):
    def __init__(self, num_classes=NUM_EMOTIONS):
        super(MultimodalFusionNet, self).__init__()
        # Input size: 14 (7 face logits/probs + 7 speech logits/probs)
        self.shared = nn.Sequential(
            nn.Linear(14, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU()
        )
        
        # Multi-task heads
        self.emotion_head = nn.Linear(32, num_classes)
        self.intensity_head = nn.Linear(32, 1)
        self.stress_head = nn.Linear(32, 1)
        self.engagement_head = nn.Linear(32, 1)
        
    def forward(self, face_probs, speech_probs):
        # Concatenate inputs
        x = torch.cat((face_probs, speech_probs), dim=1)
        feat = self.shared(x)
        
        # Outputs
        emotion_logits = self.emotion_head(feat)
        intensity = torch.sigmoid(self.intensity_head(feat))
        stress = torch.sigmoid(self.stress_head(feat))
        engagement = torch.sigmoid(self.engagement_head(feat))
        
        return emotion_logits, intensity, stress, engagement

def get_fusion_model(pretrained=True):
    model = MultimodalFusionNet().to(DEVICE)
    if pretrained:
        if os.path.exists(FUSION_MODEL_PATH):
            try:
                model.load_state_dict(torch.load(FUSION_MODEL_PATH, map_location=DEVICE))
                print(f"[AURA FUSION MODEL] Loaded checkpoint from {FUSION_MODEL_PATH}")
            except Exception as e:
                print(f"[AURA FUSION MODEL] Error loading checkpoint: {e}. Using random weights.")
        else:
            print(f"[AURA FUSION MODEL] Checkpoint not found at {FUSION_MODEL_PATH}. Initializing default weights.")
            # Auto-save random weights so file exists
            os.makedirs(os.path.dirname(FUSION_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), FUSION_MODEL_PATH)
            export_fusion_to_onnx(model)
    return model

def export_fusion_to_onnx(model=None):
    if model is None:
        model = get_fusion_model(pretrained=False)
    model.eval()
    dummy_face = torch.randn(1, 7, device=DEVICE)
    dummy_speech = torch.randn(1, 7, device=DEVICE)
    os.makedirs(os.path.dirname(FUSION_ONNX_PATH), exist_ok=True)
    try:
        # Wrap inputs for ONNX trace
        class ONNXWrapper(nn.Module):
            def __init__(self, net):
                super().__init__()
                self.net = net
            def forward(self, f, s):
                return self.net(f, s)
                
        wrapped = ONNXWrapper(model)
        torch.onnx.export(
            wrapped,
            (dummy_face, dummy_speech),
            str(FUSION_ONNX_PATH),
            input_names=["face_probs", "speech_probs"],
            output_names=["emotion_logits", "intensity", "stress", "engagement"],
            dynamic_axes={
                "face_probs": {0: "batch_size"},
                "speech_probs": {0: "batch_size"},
                "emotion_logits": {0: "batch_size"},
                "intensity": {0: "batch_size"},
                "stress": {0: "batch_size"},
                "engagement": {0: "batch_size"}
            },
            opset_version=11
        )
        print(f"[AURA FUSION MODEL] Exported ONNX model to {FUSION_ONNX_PATH}")
    except Exception as e:
        print(f"[AURA FUSION MODEL] Failed to export ONNX: {e}")

if __name__ == "__main__":
    m = get_fusion_model(pretrained=False)
    export_fusion_to_onnx(m)
