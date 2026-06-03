import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Override Database settings for clean test runs
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from backend.main import app, get_db
from backend.database.connection import Base
from backend.database.models import User, SessionLog, EmotionResult, SystemConfig
from backend.utils.auth import hash_password, verify_password

from backend.database.connection import engine, SessionLocal

TestingSessionLocal = SessionLocal

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "AURA Emotion Engine X active"

def test_auth_flow():
    # 1. Register a test user
    payload = {"username": "testpilot", "password": "securepassword"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["username"] == "testpilot"
    
    # 2. Try registering same username (should fail)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"

    # 3. Log in with the test user
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()
    token = response.json()["access_token"]

    # 4. Access authorized profile
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "testpilot"

def test_admin_metrics():
    response = client.get("/api/admin/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "active_connections" in data
    assert "db_stats" in data
    assert "system" in data

def test_system_settings():
    # Get settings
    response = client.get("/api/settings")
    assert response.status_code == 200
    
    # Update settings
    payload = {"face_weight": 0.5, "speech_weight": 0.5}
    response = client.post("/api/settings", json=payload)
    assert response.status_code == 200
    assert response.json()["face_weight"] == 0.5
    assert response.json()["speech_weight"] == 0.5
