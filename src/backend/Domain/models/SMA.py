from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from database import Base
import enum

class SMAType(str, enum.Enum):
    MOVIE = "Movie"
    SERIES = "Series"
    ALBUM = "Album"

class SMAModel(Base):
    __tablename__ = "SMA"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    duration = Column(Integer, nullable=False)
    year_released = Column(Integer, nullable=False)
    image = Column(String(255), nullable=True)
    type = Column(SQLEnum(SMAType), nullable=False)
    description = Column(Text, nullable=False)
    number_of_reviews = Column(Integer, default=0)
    rating = Column(Float, default=0, nullable=False)

    reviews = relationship("ReviewModel", back_populates="movie", cascade="all, delete-orphan")
    watchlist = relationship("WatchlistModel", back_populates="SMA", cascade="all, delete-orphan")

