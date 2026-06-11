from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from Domain.models.watchlist import WatchlistModel


class WatchlistRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_watchlist(self, user_id: int):
        return self.db.query(WatchlistModel).filter_by(user_id=user_id).all()

    def get_by_id(self, watchlist_id: int) -> WatchlistModel | None:
        return self.db.query(WatchlistModel).filter_by(id=watchlist_id).first()

    def add(self, item):
        try:
            if isinstance(item, dict):
                item = WatchlistModel(**item)
            self.db.add(item)
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            print(f"Database error: {e}")
            raise e

    def delete(self, watchlist_id: int) -> bool:
        db_watchlist = self.get_by_id(watchlist_id)
        if db_watchlist:
            self.db.delete(db_watchlist)
            self.db.commit()
            return True
        return False