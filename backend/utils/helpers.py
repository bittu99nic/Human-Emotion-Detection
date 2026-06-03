import logging
import torch
import numpy as np

# Configure Logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("AURA")

def get_logger(name: str):
    return logging.getLogger(f"AURA.{name}")

def softmax(x):
    """Compute softmax values for any list or numpy array x."""
    e_x = np.exp(x - np.max(x))
    return (e_x / e_x.sum(axis=0)).tolist()

def get_gpu_info():
    """
    Returns GPU utilization statistics if CUDA is active.
    """
    info = {
        "cuda_available": torch.cuda.is_available(),
        "device_count": torch.cuda.device_count(),
        "device_name": "N/A",
        "allocated_mb": 0.0,
        "cached_mb": 0.0
    }
    
    if info["cuda_available"]:
        info["device_name"] = torch.cuda.get_device_name(0)
        info["allocated_mb"] = round(torch.cuda.memory_allocated(0) / 1024 / 1024, 2)
        info["cached_mb"] = round(torch.cuda.memory_reserved(0) / 1024 / 1024, 2)
        
    return info
