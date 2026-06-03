import os
import torch
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "ai_models" / "weights"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FACE_MODEL_PATH = MODEL_DIR / "face_model.pth"
FACE_ONNX_PATH = MODEL_DIR / "face_model.onnx"

SPEECH_MODEL_PATH = MODEL_DIR / "speech_model.pth"
SPEECH_ONNX_PATH = MODEL_DIR / "speech_model.onnx"

FUSION_MODEL_PATH = MODEL_DIR / "fusion_model.pth"
FUSION_ONNX_PATH = MODEL_DIR / "fusion_model.onnx"

# Device Configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Emotions Definition
EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral", "disgust"]
NUM_EMOTIONS = len(EMOTIONS)

# Fusion Weights (Default weights, dynamically adjustable in API)
FACE_WEIGHT = 0.6
SPEECH_WEIGHT = 0.4

# Audio Processing Settings
SAMPLE_RATE = 16000
DURATION = 3.0  # 3 seconds chunks for speech emotion
N_MFCC = 40
N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 512

# Bounding Box face settings
HAAR_CASCADE_PATH = os.path.join(os.path.dirname(__file__), "ai_models", "haarcascade_frontalface_default.xml")

# App configurations
HOST = "0.0.0.0"
PORT = 8000
LOG_LEVEL = "info"
