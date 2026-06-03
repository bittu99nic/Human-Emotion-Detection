import torch
import numpy as np
import cv2
from backend.config import DEVICE, EMOTIONS, NUM_EMOTIONS
from backend.ai_models.face_detector import FaceDetector
from backend.ai_models.face_model import get_face_model
from backend.ai_models.speech_model import get_speech_model, extract_audio_features
from backend.ai_models.fusion_model import get_fusion_model

class EmotionDetectionPipeline:
    def __init__(self):
        print("[AURA PIPELINE] Initializing Multimodal Emotion Detection Pipeline...")
        self.face_detector = FaceDetector()
        self.face_model = get_face_model(pretrained=True)
        self.speech_model = get_speech_model(pretrained=True)
        self.fusion_model = get_fusion_model(pretrained=True)
        
        self.face_model.eval()
        self.speech_model.eval()
        self.fusion_model.eval()
        print("[AURA PIPELINE] Pipeline successfully initialized on device:", DEVICE)
        
    def predict_face(self, frame_bgr):
        """
        Runs face detection and facial emotion classification.
        Returns:
            list of dicts containing 'bbox': [x, y, w, h], 'probs': list of 7 floats, 'label': string
        """
        faces_tensor, bboxes = self.face_detector.detect_and_preprocess_faces(frame_bgr)
        if faces_tensor is None or len(bboxes) == 0:
            return []
            
        results = []
        with torch.no_grad():
            outputs = self.face_model(faces_tensor)
            probs = torch.softmax(outputs, dim=1).cpu().numpy()
            
        for i, bbox in enumerate(bboxes):
            face_probs = probs[i].tolist()
            label_idx = int(np.argmax(face_probs))
            results.append({
                "bbox": bbox,
                "probs": face_probs,
                "label": EMOTIONS[label_idx],
                "confidence": float(face_probs[label_idx])
            })
            
        return results

    def predict_speech(self, audio_y, sr=16000):
        """
        Extracts features and predicts speech emotion.
        Returns:
            probs: list of 7 floats, or None if no audio or feature error
        """
        if audio_y is None or len(audio_y) < 100:
            return None
            
        features = extract_audio_features(audio_y, sr)
        if np.all(features == 0):
            return None
            
        features_tensor = torch.tensor(features, dtype=torch.float32, device=DEVICE).unsqueeze(0) # [1, 187]
        
        with torch.no_grad():
            outputs = self.speech_model(features_tensor)
            probs = torch.softmax(outputs, dim=1).cpu().numpy()[0].tolist()
            
        return probs

    def predict_fusion(self, face_probs, speech_probs):
        """
        Runs the neural fusion network to calculate the combined emotional state.
        Args:
            face_probs: list/array of 7 probabilities
            speech_probs: list/array of 7 probabilities
        Returns:
            dict containing combined emotion predictions and secondary state estimations.
        """
        f_tensor = torch.tensor([face_probs], dtype=torch.float32, device=DEVICE)
        s_tensor = torch.tensor([speech_probs], dtype=torch.float32, device=DEVICE)
        
        with torch.no_grad():
            emotion_logits, intensity, stress, engagement = self.fusion_model(f_tensor, s_tensor)
            fused_probs = torch.softmax(emotion_logits, dim=1).cpu().numpy()[0].tolist()
            
        label_idx = int(np.argmax(fused_probs))
        
        return {
            "probs": fused_probs,
            "label": EMOTIONS[label_idx],
            "confidence": float(fused_probs[label_idx]),
            "intensity": float(intensity.cpu().item()),
            "stress_level": float(stress.cpu().item()),
            "engagement_score": float(engagement.cpu().item())
        }

    def process_multimodal(self, frame_bgr=None, audio_y=None, sr=16000):
        """
        Main interface to process both webcam frames and microphone streams.
        Handles cases where one or both feeds are missing.
        """
        face_results = []
        speech_probs = None
        
        # 1. Process Face
        if frame_bgr is not None:
            face_results = self.predict_face(frame_bgr)
            
        # 2. Process Speech
        if audio_y is not None:
            speech_probs = self.predict_speech(audio_y, sr)
            
        # Fallback vectors
        # Neutral distribution: equal chance, or 100% neutral index (index 5)
        neutral_probs = [0.0] * NUM_EMOTIONS
        neutral_probs[5] = 1.0 # Index 5 is neutral
        
        # Determine inputs for fusion
        f_probs = face_results[0]["probs"] if len(face_results) > 0 else neutral_probs
        s_probs = speech_probs if speech_probs is not None else neutral_probs
        
        # 3. Process Fusion
        fusion_result = self.predict_fusion(f_probs, s_probs)
        
        # Calculate visual bounds / names
        active_faces = []
        for face in face_results:
            active_faces.append({
                "bbox": face["bbox"],
                "label": face["label"],
                "confidence": face["confidence"]
            })
            
        speech_label = EMOTIONS[int(np.argmax(speech_probs))] if speech_probs is not None else "silent"
        speech_confidence = float(np.max(speech_probs)) if speech_probs is not None else 0.0
        
        return {
            "faces": active_faces,
            "speech": {
                "active": speech_probs is not None,
                "label": speech_label,
                "confidence": speech_confidence,
                "probs": speech_probs if speech_probs is not None else neutral_probs
            },
            "fusion": {
                "label": fusion_result["label"],
                "confidence": fusion_result["confidence"],
                "intensity": fusion_result["intensity"],
                "stress_level": fusion_result["stress_level"],
                "engagement_score": fusion_result["engagement_score"],
                "probs": fusion_result["probs"]
            }
        }
