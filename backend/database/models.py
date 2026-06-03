from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user") # user, admin
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("SessionLog", back_populates="user", cascade="all, delete-orphan")

class SessionLog(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    device_info = Column(String, default="Unknown Browser")

    user = relationship("User", back_populates="sessions")
    emotion_results = relationship("EmotionResult", back_populates="session", cascade="all, delete-orphan")

class EmotionResult(Base):
    __tablename__ = "emotion_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(Float, nullable=False) # Offset seconds from session start or absolute UNIX time
    emotion = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    intensity = Column(Float, nullable=False)
    stress_level = Column(Float, nullable=False)
    engagement_score = Column(Float, nullable=False)
    source_type = Column(String, nullable=False) # face, speech, fusion

    session = relationship("SessionLog", back_populates="emotion_results")

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
