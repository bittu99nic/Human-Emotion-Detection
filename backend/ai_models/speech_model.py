import numpy as np
import librosa
import torch
import torch.nn as nn
import torch.nn.functional as F
import os
from backend.config import DEVICE, SPEECH_MODEL_PATH, SPEECH_ONNX_PATH, NUM_EMOTIONS, SAMPLE_RATE

def extract_audio_features(y, sr=SAMPLE_RATE):
    """
    Extracts speech emotion features from raw audio waveform:
    MFCC, Chroma, Mel Spectrogram, and Spectral Contrast.
    Returns a 187-dimensional flat numpy array.
    """
    try:
        # Avoid division by zero warnings
        if len(y) == 0:
            return np.zeros(187, dtype=np.float32)
            
        # Standardize volume
        y = librosa.util.normalize(y)
        
        # 1. MFCCs (40 coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        mfccs_mean = np.mean(mfccs, axis=1) # 40
        
        # 2. Chroma
        # Using a small hop_length to ensure we get frames even for short audio
        stft = np.abs(librosa.stft(y))
        chroma = librosa.feature.chroma_stft(S=stft, sr=sr)
        chroma_mean = np.mean(chroma, axis=1) # 12
        
        # 3. Mel Spectrogram (128 bands)
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        mel_mean = np.mean(librosa.power_to_db(mel), axis=1) # 128
        
        # 4. Spectral Contrast (7 bands)
        contrast = librosa.feature.spectral_contrast(S=stft, sr=sr, n_bands=6)
        contrast_mean = np.mean(contrast, axis=1) # 7
        
        # Concatenate all features
        features = np.hstack([mfccs_mean, chroma_mean, mel_mean, contrast_mean]) # 40 + 12 + 128 + 7 = 187
        return features.astype(np.float32)
    except Exception as e:
        print(f"[AURA FEATURE EXTRACTION] Error extracting audio features: {e}")
        return np.zeros(187, dtype=np.float32)

class SpeechEmotionMLP(nn.Module):
    def __init__(self, input_dim=187, num_classes=NUM_EMOTIONS):
        super(SpeechEmotionMLP, self).__init__()
        self.fc1 = nn.Linear(input_dim, 256)
        self.bn1 = nn.BatchNorm1d(256)
        self.dropout1 = nn.Dropout(0.3)
        
        self.fc2 = nn.Linear(256, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.dropout2 = nn.Dropout(0.3)
        
        self.fc3 = nn.Linear(128, 64)
        self.bn3 = nn.BatchNorm1d(64)
        self.dropout3 = nn.Dropout(0.2)
        
        self.fc4 = nn.Linear(64, num_classes)
        
    def forward(self, x):
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout1(x)
        
        x = F.relu(self.bn2(self.fc2(x)))
        x = self.dropout2(x)
        
        x = F.relu(self.bn3(self.fc3(x)))
        x = self.dropout3(x)
        
        x = self.fc4(x)
        return x

def get_speech_model(pretrained=True):
    model = SpeechEmotionMLP().to(DEVICE)
    if pretrained:
        if os.path.exists(SPEECH_MODEL_PATH):
            try:
                model.load_state_dict(torch.load(SPEECH_MODEL_PATH, map_location=DEVICE))
                print(f"[AURA SPEECH MODEL] Loaded checkpoint from {SPEECH_MODEL_PATH}")
            except Exception as e:
                print(f"[AURA SPEECH MODEL] Error loading checkpoint: {e}. Using random weights.")
        else:
            print(f"[AURA SPEECH MODEL] Checkpoint not found at {SPEECH_MODEL_PATH}. Initializing default weights.")
            # Auto-save random weights so file exists
            os.makedirs(os.path.dirname(SPEECH_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), SPEECH_MODEL_PATH)
            export_speech_to_onnx(model)
    return model

def export_speech_to_onnx(model=None):
    if model is None:
        model = get_speech_model(pretrained=False)
    model.eval()
    dummy_input = torch.randn(1, 187, device=DEVICE)
    os.makedirs(os.path.dirname(SPEECH_ONNX_PATH), exist_ok=True)
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(SPEECH_ONNX_PATH),
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
            opset_version=11
        )
        print(f"[AURA SPEECH MODEL] Exported ONNX model to {SPEECH_ONNX_PATH}")
    except Exception as e:
        print(f"[AURA SPEECH MODEL] Failed to export ONNX: {e}")

if __name__ == "__main__":
    m = get_speech_model(pretrained=False)
    export_speech_to_onnx(m)
