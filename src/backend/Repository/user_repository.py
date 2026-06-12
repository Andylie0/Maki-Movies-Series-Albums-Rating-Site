from sqlalchemy.orm import Session
from Domain.models.user import UserModel

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> UserModel | None:
        return self.db.query(UserModel).filter_by(username=username).first()

    def get_by_id(self, user_id: int) -> UserModel | None:
        return self.db.query(UserModel).filter_by(id=user_id).first()

    def create(self, user: UserModel) -> UserModel:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: UserModel):
        self.db.commit()
        self.db.refresh(user)