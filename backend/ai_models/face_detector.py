import cv2
import os
import urllib.request
import numpy as np
import torch
from backend.config import HAAR_CASCADE_PATH, DEVICE

def download_cascade_if_needed():
    """
    Downloads OpenCV's Haar Cascade face detector if it does not exist locally.
    """
    if not os.path.exists(HAAR_CASCADE_PATH):
        print(f"[AURA FACE DETECTOR] Cascade file not found at {HAAR_CASCADE_PATH}. Downloading from OpenCV repo...")
        os.makedirs(os.path.dirname(HAAR_CASCADE_PATH), exist_ok=True)
        url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        try:
            # Add user-agent header to avoid blocked downloads
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response, open(HAAR_CASCADE_PATH, 'wb') as out_file:
                out_file.write(response.read())
            print(f"[AURA FACE DETECTOR] Haar Cascade XML successfully downloaded to {HAAR_CASCADE_PATH}")
        except Exception as e:
            print(f"[AURA FACE DETECTOR] Error downloading cascade: {e}")
            # Write a backup dummy trigger or raise
            raise FileNotFoundError(f"Failed to fetch Haar Cascade xml for face detection. Please place it at: {HAAR_CASCADE_PATH}")

class FaceDetector:
    def __init__(self):
        download_cascade_if_needed()
        self.face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
        
    def detect_and_preprocess_faces(self, frame_bgr):
        """
        Detects faces in BGR image.
        Returns:
            processed_faces: PyTorch tensor [N, 1, 48, 48] normalized
            bounding_boxes: List of [x, y, w, h] for each face
        """
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        processed_faces = []
        bounding_boxes = []
        
        for (x, y, w, h) in faces:
            # Crop the face
            face_crop = gray[y:y+h, x:x+w]
            # Resize to FER2013 dimensions
            face_resized = cv2.resize(face_crop, (48, 48))
            # Normalize to 0-1 range
            face_normalized = face_resized.astype(np.float32) / 255.0
            
            processed_faces.append(face_normalized)
            bounding_boxes.append([int(x), int(y), int(w), int(h)])
            
        if len(processed_faces) > 0:
            # Convert list of 2D arrays to a tensor of shape [N, 1, 48, 48]
            faces_tensor = torch.tensor(np.array(processed_faces), dtype=torch.float32, device=DEVICE)
            faces_tensor = faces_tensor.unsqueeze(1) # Add channel dim
            return faces_tensor, bounding_boxes
        
        return None, []
