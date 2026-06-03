import os
import zipfile
import urllib.request
import numpy as np
import cv2
import soundfile as sf

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))

def ensure_dirs():
    os.makedirs(DATASETS_DIR, exist_ok=True)
    os.makedirs(os.path.join(DATASETS_DIR, "speech_ravdess"), exist_ok=True)
    os.makedirs(os.path.join(DATASETS_DIR, "speech_tess"), exist_ok=True)
    os.makedirs(os.path.join(DATASETS_DIR, "facial_fer2013"), exist_ok=True)
    os.makedirs(os.path.join(DATASETS_DIR, "preprocessed"), exist_ok=True)

def download_file(url, filepath):
    print(f"[AURA DATASET DOWNLOAD] Downloading {url} to {filepath}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        print(f"[AURA DATASET DOWNLOAD] Completed: {filepath}")
        return True
    except Exception as e:
        print(f"[AURA DATASET DOWNLOAD] Error downloading {url}: {e}")
        return False

def create_synthetic_data(num_samples=100):
    """
    Creates synthetic wav files and face image files for instant testing.
    """
    ensure_dirs()
    print("[AURA DATASET SETUP] Generating synthetic datasets for testing...")
    
    # 1. Synthetic Speech (RAVDESS format: Actor_XX/03-01-01-01-01-01-XX.wav)
    # Emotion labels in RAVDESS: 01 = neutral, 03 = happy, 04 = sad, 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised
    ravdess_dir = os.path.join(DATASETS_DIR, "speech_ravdess")
    emotions_map = {1: "neutral", 3: "happy", 4: "sad", 5: "angry", 6: "fear", 7: "disgust", 8: "surprise"}
    
    for actor in range(1, 3): # 2 Actors
        actor_dir = os.path.join(ravdess_dir, f"Actor_{actor:02d}")
        os.makedirs(actor_dir, exist_ok=True)
        
        for emo_code, emo_name in emotions_map.items():
            for trial in range(1, 3): # 2 trials per emotion
                filename = f"03-01-{emo_code:02d}-01-01-01-{actor:02d}.wav"
                filepath = os.path.join(actor_dir, filename)
                
                # Generate synthetic audio: sine wave + white noise
                sr = 16000
                duration = 3.0
                t = np.linspace(0, duration, int(sr * duration), endpoint=False)
                
                # Different frequencies for different emotions to simulate feature variation
                freq = 200 + emo_code * 50
                signal = np.sin(2 * np.pi * freq * t)
                
                # Add noise
                noise = np.random.normal(0, 0.1, len(signal))
                audio = signal + noise
                
                sf.write(filepath, audio, sr)
                
    # 2. Synthetic Facial (FER2013 format)
    # Generate folders for happy, sad, angry, fear, surprise, neutral, disgust
    fer_dir = os.path.join(DATASETS_DIR, "facial_fer2013")
    for emo_name in ["happy", "sad", "angry", "fear", "surprise", "neutral", "disgust"]:
        emo_folder = os.path.join(fer_dir, emo_name)
        os.makedirs(emo_folder, exist_ok=True)
        
        for sample_idx in range(5): # 5 sample images per class
            filename = f"face_{sample_idx}.jpg"
            filepath = os.path.join(emo_folder, filename)
            
            # Generate a 48x48 synthetic face image (a simple circle or pattern)
            img = np.zeros((48, 48), dtype=np.uint8)
            cv2.circle(img, (24, 24), 15, 255, -1)
            
            # Draw features based on emotion
            if emo_name == "happy":
                cv2.circle(img, (18, 18), 2, 0, -1) # Eye
                cv2.circle(img, (30, 18), 2, 0, -1) # Eye
                cv2.ellipse(img, (24, 28), (8, 4), 0, 0, 180, 0, 2) # Smile
            elif emo_name == "sad":
                cv2.circle(img, (18, 18), 2, 0, -1) # Eye
                cv2.circle(img, (30, 18), 2, 0, -1) # Eye
                cv2.ellipse(img, (24, 32), (8, 4), 0, 180, 360, 0, 2) # Frown
            else:
                cv2.circle(img, (18, 18), 2, 0, -1) # Eye
                cv2.circle(img, (30, 18), 2, 0, -1) # Eye
                cv2.line(img, (16, 28), (32, 28), 0, 2) # Neutral mouth
                
            cv2.imwrite(filepath, img)
            
    print(f"[AURA DATASET SETUP] Synthetic datasets generated in: {DATASETS_DIR}")

def main():
    ensure_dirs()
    # By default, we initialize the synthetic structure so testing is instant
    create_synthetic_data()

if __name__ == "__main__":
    main()
