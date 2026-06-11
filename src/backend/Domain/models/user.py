from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255), nullable=False)
    image = Column(String(255), nullable=True)

    role = Column(String(20), default="user")
    watchlist = relationship("WatchlistModel", back_populates="user")
    reviews = relationship("ReviewModel", back_populates="author")
    observations = relationship("ObservationModel", back_populates="user", cascade="all, delete-orphan")