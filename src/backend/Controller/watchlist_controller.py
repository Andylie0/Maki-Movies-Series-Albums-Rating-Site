from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from Repository.log_repository import LogRepository
from Repository.watchlist_repository import WatchlistRepository
from Service.log_service import LogService
from Service.watchlist_service import WatchlistService
from database import get_db
from sqlalchemy.orm import Session
from Service.websocket_manager import ws_manager

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

def get_watchlist_service(db : Session = Depends(get_db)):
    log_repo = LogRepository(db)
    log_service = LogService(log_repo)

    return WatchlistService(
        watchlist_repo = WatchlistRepository(db),
        log_service=log_service,
        ws_manager = ws_manager
    )

@router.get("/")
async def get_watchlist(user_id: int = Query(None), service: WatchlistService = Depends(get_watchlist_service)):
    items = service.get_watchlist(user_id)
    return [
        {
            "id": item.id,
            "timestamp": item.timestamp,
            "movie_id": item.movie_id,
            "user_id": item.user_id
        }
        for item in items
    ]

@router.post("/",response_model=None)
async def add_watchlist(data: dict, user_id: int = Query(...), service: WatchlistService = Depends(get_watchlist_service)):
    return await service.add_watchlist(data, user_id)

@router.delete("/{watchlist_id}")
async def delete_review(watchlist_id: int, user_id : int = Query(...), service: WatchlistService = Depends(get_watchlist_service)):
    success = await service.remove_watchlist(watchlist_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return {"message": "Deleted successfully"}
