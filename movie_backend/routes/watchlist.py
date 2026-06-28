from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
 
from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token
 
from movie_backend.schemas.watchlist_schema import (
    WatchlistResponse
)
 
from movie_backend.schemas.response_schema import (
    MessageResponse
)
 
from movie_backend.services.watchlist_service import (
    add_watchlist_service,
    remove_watchlist_service,
    get_watchlist_service
)
 
router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"]
)
 
 
@router.post(
    "/add/{movie_id}",
    response_model=WatchlistResponse,
    dependencies=[Depends(rate_limit(20, 60))]
)
async def add_to_watchlist(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await add_watchlist_service(
        movie_id,
        db,
        current_user
    )
 
 
@router.delete(
    "/{movie_id}",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(20, 60))]
)
async def remove_from_watchlist(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await remove_watchlist_service(
        movie_id,
        db,
        current_user
    )
 
 
@router.get(
    "/",
    response_model=list[WatchlistResponse],
    dependencies=[Depends(rate_limit(60, 60))]
)
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await get_watchlist_service(
        db,
        current_user
    )