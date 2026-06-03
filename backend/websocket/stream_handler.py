import base64
import numpy as np
import cv2
import io
import soundfile as sf
import librosa
from backend.ai_models.pipeline import EmotionDetectionPipeline

# Global or instance pipeline
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = EmotionDetectionPipeline()
    return _pipeline

def decode_video_frame(base64_str: str):
    """
    Decodes a base64 encoded JPG/PNG image into a BGR OpenCV image.
    """
    try:
        if not base64_str:
            return None
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[AURA WS DECODE] Error decoding video frame: {e}")
        return None

def decode_audio_chunk(base64_str: str, target_sr=16000):
    """
    Decodes base64 encoded audio (wav file bytes or raw pcm) into float32 numpy array.
    """
    try:
        if not base64_str:
            return None
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        audio_bytes = base64.b64decode(base64_str)
        
        # Try loading as a file (WAV/WEBM/OGG)
        try:
            data, samplerate = sf.read(io.BytesIO(audio_bytes))
            # Convert to mono if stereo
            if len(data.shape) > 1:
                data = np.mean(data, axis=1)
            # Resample if needed
            if samplerate != target_sr:
                data = librosa.resample(data, orig_sr=samplerate, target_sr=target_sr)
            return data.astype(np.float32)
        except Exception as file_err:
            # Fallback to loading raw float32 PCM data
            try:
                data = np.frombuffer(audio_bytes, dtype=np.float32)
                # Ensure it's not empty and reasonable
                if len(data) > 0:
                    return data
            except Exception as raw_err:
                print(f"[AURA WS DECODE] File decode failed ({file_err}) and PCM float decode failed ({raw_err})")
                
        return None
    except Exception as e:
        print(f"[AURA WS DECODE] Error decoding audio: {e}")
        return None

async def handle_stream_payload(payload: dict) -> dict:
    """
    Decodes fields in websocket JSON payload and runs the multimodal pipeline.
    """
    video_b64 = payload.get("video")
    audio_b64 = payload.get("audio")
    
    frame_bgr = decode_video_frame(video_b64)
    audio_y = decode_audio_chunk(audio_b64)
    
    pipeline = get_pipeline()
    
    # Run the pipeline
    results = pipeline.process_multimodal(frame_bgr=frame_bgr, audio_y=audio_y)
    return results
