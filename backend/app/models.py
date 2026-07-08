# Import Libraries
from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Define the database models
Base = declarative_base()

# User model to store user information
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Analysis model to store results of financial analysis
class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    summary = Column(Text, nullable=False)
    patterns = Column(JSON, nullable=False)
    flags = Column(JSON, nullable=False)
    total_transactions = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

# Transaction model to store individual transactions associated with an analysis
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    date = Column(String, nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

# ChatMessage model to store questions and answers related to an analysis
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)