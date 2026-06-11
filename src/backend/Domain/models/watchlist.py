from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import func

class WatchlistModel(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    movie_id = Column(Integer, ForeignKey("SMA.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("UserModel", back_populates="watchlist")
    SMA = relationship("SMAModel", back_populates="watchlist")