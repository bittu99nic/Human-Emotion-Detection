# AURA Emotion Engine

AURA Emotion Engine is an ultra-futuristic, production-ready, AI-powered multimodal Human Emotion Detection web application. It monitors expressions via webcam visual streams and voice tones via microphone acoustic feeds, running the raw features through PyTorch neural networks and fusing them to predict primary emotional states, intensity levels, stress thresholds, and engagement rates.

---

## Technical Stack

*   **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, Framer Motion, Recharts, HTML5 WebRTC.
*   **Backend**: Python FastAPI, WebSocket streaming, Async queue processor, OpenCV.
*   **ML & AI Pipeline**: PyTorch (Multimodal Neural Fusion layers, FER2013-CNN classification, Speech MLP feature classifiers), Librosa audio analysis, Soundfile bytes encoders.

---

## Folder Architecture

```
Human_Emotion_Detection/
├── backend/
│   ├── main.py                     # FastAPI Application gateway
│   ├── config.py                   # Central configurations & parameters
│   ├── ai_models/                  # PyTorch model definitions & pipelines
│   ├── websocket/                  # Socket connection & stream decoders
│   ├── training/                   # Datasets setup, preprocessing, & loops
│   ├── datasets/                   # Preprocessed .npz outputs
│   └── requirements.txt            # Python requirements
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js 15 pages (App router)
│   │   ├── components/             # Cyberpunk glass HUD controls
│   │   ├── hooks/                  # useWebSocket sensory hooks
│   │   └── utils/                  # Exporters & file managers
│   ├── package.json
│   └── tailwind.config.ts
├── docker/                     # Dockerfiles
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

## Installation & Setup

Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 1. Backend Setup

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Start the FastAPI Server:
    ```bash
    uvicorn main:app --reload
    ```
    The server initializes automatically. If the model checkpoints (`.pth`) are missing, **AURA self-generates random weights checkpoints** and saves them alongside their ONNX exports. This guarantees the server starts immediately without requiring large downloads!

### 2. Frontend Setup

1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the Next.js Dev Server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Machine Learning Pipeline

### Dataset Download & Synthetic Fallback

To train the models locally, AURA features a script that compiles directory layouts, generates synthetic acoustic wave files and face structures, and processes them:

1.  Set up datasets and run preprocessors:
    ```bash
    python backend/training/download_datasets.py
    python backend/training/preprocess.py
    ```
    *This generates synthetic audio WAV folders (mocking RAVDESS structure) and image assets (mocking FER2013 structure) to test the training code instantly.*

### Executing Model Training

Run training loops for the individual sensory cores:

*   **Train Facial CNN**:
    ```bash
    python -m backend.training.train_face
    ```
*   **Train Speech Classifier**:
    ```bash
    python -m backend.training.train_speech
    ```
*   **Train Fusion Network**:
    ```bash
    python -m backend.training.train_fusion
    ```
Upon completion, the networks write optimal checkpoint structures to `backend/ai_models/weights/` and trace-compile themselves to optimized **ONNX format models** for fast low-latency deployment.

---

## Docker Deployment (GPU/CPU)

To spin up the AURA portal under unified container services:

```bash
docker-compose up --build
```
*   Backend service maps to `http://localhost:8000`
*   Frontend HUD maps to `http://localhost:3000`

---

## Advanced Sensory Features

*   **Interactive AI Therapist**: Evaluates stress dynamics and answers questions matching response narratives to valence outputs.
*   **Burnout Alert Gauge**: Combines high continuous stress states with low attention cues to yield fatigue indices.
*   **Enterprise Multi-Modes**: Toggle monitors calibrating Classroom Focus Indexes, applicant Stress ratios (Lie Indicator), or customer Frustration trackers.
