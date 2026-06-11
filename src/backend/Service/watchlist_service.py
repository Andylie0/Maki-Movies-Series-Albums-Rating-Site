from typing import Dict, Any

from Domain.models.watchlist import WatchlistModel
from Repository.watchlist_repository import WatchlistRepository
from Service.log_service import LogService


class WatchlistService:
    def __init__(self, watchlist_repo : WatchlistRepository, log_service: LogService, ws_manager):
        self.watchlist_repo = watchlist_repo
        self.log_service = log_service
        self.ws_manager = ws_manager

    def get_watchlist(self, user_id: int):
        return self.watchlist_repo.get_watchlist(user_id)

    async def add_watchlist(self, data: Dict[str, Any], user_id: int):
        new_watchlist = WatchlistModel(**data, user_id=user_id)
        saved_watchlist = self.watchlist_repo.add(new_watchlist)

        self.log_service.log_and_check(
            user_id=user_id,
            action="ADDED_TO_WATCHLIST",
            group_id=f"CREATED_WATCHLIST_ID_{saved_watchlist.id}_FOR_MOVIE_{saved_watchlist.movie_id}"
        )

        await self.ws_manager.broadcast({
            "type": "NEW_WATCHLIST",
            "message": f"New watchlist added for {user_id}",
            "user_id": user_id
        })

        return saved_watchlist

    async def remove_watchlist(self, watchlist_id: int, user_id: int):
        watchlist = self.watchlist_repo.get_by_id(watchlist_id)
        if not watchlist:
            return False

        success = self.watchlist_repo.delete(watchlist_id)

        self.log_service.log_and_check(
            user_id=user_id,
            group_id="user",
            action=f"DELETED_WATCHLIST_ID_{watchlist_id}"
        )

        await self.ws_manager.broadcast({"type": "DELETE_WATCHLIST", "user_id": user_id})
        return success
