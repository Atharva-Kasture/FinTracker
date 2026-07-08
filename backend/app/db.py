#Importing Libraries
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.config import settings

#Connexts to your SQLite database using SQLAlchemy
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Takes 4 models and creates tables in the database if they don't exist
def init_db():
    Base.metadata.create_all(bind=engine)

#Gives your routes a database connection that can be used.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()