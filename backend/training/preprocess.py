import os
import glob
import numpy as np
import cv2
import librosa
import soundfile as sf
from backend.config import EMOTIONS, NUM_EMOTIONS, SAMPLE_RATE
from backend.ai_models.speech_model import extract_audio_features

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
PREPROCESSED_DIR = os.path.join(DATASETS_DIR, "preprocessed")

# RAVDESS Emotion Map (01 = neutral, 02 = calm, 03 = happy, 04 = sad, 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised)
# Calm is mapped to neutral, surprised is surprise, fearful to fear
RAVDESS_MAP = {
    "01": "neutral",
    "02": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fear",
    "07": "disgust",
    "08": "surprise"
}

def preprocess_speech():
    """
    Extracts features from all audio samples in speech_ravdess.
    Saves a single preprocessed npz file.
    """
    print("[AURA SPEECH PREPROCESS] Scanning speech files...")
    audio_files = glob.glob(os.path.join(DATASETS_DIR, "speech_ravdess", "Actor_*", "*.wav"))
    
    if len(audio_files) == 0:
        print("[AURA SPEECH PREPROCESS] No speech files found! Run download_datasets first.")
        return False
        
    X = []
    y = []
    
    for idx, f in enumerate(audio_files):
        filename = os.path.basename(f)
        parts = filename.split("-")
        if len(parts) < 3:
            continue
            
        rav_emo = parts[2]
        emo_name = RAVDESS_MAP.get(rav_emo)
        if emo_name not in EMOTIONS:
            continue
            
        label = EMOTIONS.index(emo_name)
        
        # Load audio
        try:
            audio, sr = sf.read(f)
            # Ensure proper sample rate
            if sr != SAMPLE_RATE:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
            
            features = extract_audio_features(audio, SAMPLE_RATE)
            if np.all(features == 0):
                continue
                
            X.append(features)
            y.append(label)
        except Exception as e:
            print(f"[AURA SPEECH PREPROCESS] Error processing file {f}: {e}")
            
    if len(X) == 0:
        print("[AURA SPEECH PREPROCESS] Extracted 0 valid features.")
        return False
        
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    
    output_path = os.path.join(PREPROCESSED_DIR, "speech_features.npz")
    np.savez_compressed(output_path, X=X, y=y)
    print(f"[AURA SPEECH PREPROCESS] Saved {len(X)} samples to {output_path}")
    return True

def preprocess_facial():
    """
    Extracts images from facial_fer2013 folder.
    Saves a preprocessed npz file.
    """
    print("[AURA FACE PREPROCESS] Scanning facial images...")
    X = []
    y = []
    
    for emo_idx, emo_name in enumerate(EMOTIONS):
        folder = os.path.join(DATASETS_DIR, "facial_fer2013", emo_name)
        if not os.path.exists(folder):
            continue
            
        images = glob.glob(os.path.join(folder, "*.jpg")) + glob.glob(os.path.join(folder, "*.png"))
        for img_path in images:
            try:
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue
                img_resized = cv2.resize(img, (48, 48))
                img_normalized = img_resized.astype(np.float32) / 255.0
                
                X.append(img_normalized)
                y.append(emo_idx)
            except Exception as e:
                print(f"[AURA FACE PREPROCESS] Error processing image {img_path}: {e}")
                
    if len(X) == 0:
        print("[AURA FACE PREPROCESS] Extracted 0 facial samples.")
        return False
        
    X = np.array(X, dtype=np.float32)
    X = np.expand_dims(X, axis=1) # Shape: [N, 1, 48, 48]
    y = np.array(y, dtype=np.int64)
    
    output_path = os.path.join(PREPROCESSED_DIR, "face_features.npz")
    np.savez_compressed(output_path, X=X, y=y)
    print(f"[AURA FACE PREPROCESS] Saved {len(X)} samples to {output_path}")
    return True

def main():
    os.makedirs(PREPROCESSED_DIR, exist_ok=True)
    speech_success = preprocess_speech()
    face_success = preprocess_facial()
    if speech_success and face_success:
        print("[AURA PREPROCESS] Preprocessing finished successfully!")
    else:
        print("[AURA PREPROCESS] Completed with warnings (some dataset directories may be empty).")

if __name__ == "__main__":
    main()
