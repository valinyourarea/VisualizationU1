from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, func
from .database import Base
from typing import Optional
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB


class Users(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    user_id = Column(String(10), primary_key=True, index=True)
    age = Column(Integer, index=True, nullable=False)
    country = Column(String(25), index=True, nullable=False)
    subscription_type = Column(String(50), index=True, nullable=False)
    registration_date = Column(Date, index=True, nullable=False)
    total_watch_time_hours = Column(Float, index=True, nullable=False)

    # Relationships
    viewing_sessions = relationship("Viewing_Sessions", back_populates="users")
    logs = relationship("Logs", back_populates="users")

class Viewing_Sessions(Base):
    __tablename__ = "viewing_sessions"
    __table_args__ = {'extend_existing': True}

    session_id = Column(String(10), primary_key=True, index=True)
    user_id = Column(String(10), ForeignKey("users.user_id"),  nullable=False)
    content_id = Column(String(10), ForeignKey("content.content_id"), nullable=False)
    watch_date = Column(Date, index=True, nullable=False)
    watch_duration_minutes = Column(Float, index=True, nullable=False)
    completion_percentage = Column(Float, nullable=False)
    device_type = Column(String(20), index=True, nullable=False)
    quality_level = Column(String(20), index=True, nullable=False)

    # Relationship
    users = relationship("Users", back_populates="viewing_sessions")
    content = relationship("Content", back_populates="viewing_sessions")
    

class Content(Base):
    __tablename__ = "content"
    __table_args__ = {'extend_existing': True}

    content_id = Column(String(10), primary_key=True, index=True)
    title = Column(String(50), index=True, nullable=False)
    content_type = Column(String(50), index=True, nullable=False)
    genre = Column(JSONB, index=True, nullable=False)
    rating = Column(Float, index=True, nullable=False)
    production_budget = Column(Float, index=True, nullable=False)
    
    

    # Relationship
    viewing_sessions = relationship("Viewing_Sessions", back_populates="content")

class Movies(Base):
    __tablename__ = "movies"
    __table_args__ = {'extend_existing': True}

    content_id = Column(String(10), ForeignKey("content.content_id"), primary_key=True, index=True)
    duration_minutes = Column(Integer, index=True, nullable=False)
    views_count = Column(Float, index=True, nullable=False)
    release_year = Column(Integer, index=True, nullable=False)

    # Relationship
    content = relationship("Content", back_populates="movies") 

class Series(Base):
    __tablename__ = "series"
    __table_args__ = {'extend_existing': True}

    content_id = Column(String(10), ForeignKey("content.content_id"), primary_key=True, index=True)
    avg_episode_duration = Column(Integer, index=True, nullable=False)
    episodes_per_season = Column(JSONB, index=True, nullable=False)
    total_views = Column(Float, index=True, nullable=False)

    # Relationship
    content = relationship("Content", back_populates="movies") 

