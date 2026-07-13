from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from movie_app.movie_backend.database.database import get_db
from movie_app.movie_backend.util.helpers import verify_token
from movie_app.movie_backend.schemas.watch_history_schema import WatchHistoryRequest, WatchHistoryResponse
import movie_app.movie_backend.services.watch_history_service as watch_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/watch-history",
    tags=["Watch History"],
)



@router.post(
    "/",
    response_model=WatchHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Add or update watch history",
)
async def upsert_watch_history(
    payload: WatchHistoryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token),
):
    logger.info(f"Upsert watch history request received. User ID: {current_user['id']}, Movie ID: {payload.movie_id}")
    return await watch_service.upsert_watch_history(db, current_user["id"], payload)



@router.get(
    "/",
    response_model=list[WatchHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get full watch history",
)
async def get_watch_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token),
):
    logger.info(f"Get watch history request received. User ID: {current_user['id']}")
    return await watch_service.get_user_watch_history(db, current_user["id"])



@router.get(
    "/continue-watching",
    response_model=list[WatchHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get continue watching list",
)
async def continue_watching(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token),
):
    logger.info(f"Continue watching request received. User ID: {current_user['id']}")
    return await watch_service.get_continue_watching(db, current_user["id"])


@router.get(
    "/{movie_id}",
    response_model=WatchHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get watch history for a specific movie",
)
async def get_movie_history(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token),
):
    logger.info(f"Get movie watch history request received. User ID: {current_user['id']}, Movie ID: {movie_id}")
    return await watch_service.get_movie_watch_history(db, current_user["id"], movie_id)



@router.patch(
    "/{movie_id}/complete",
    response_model=WatchHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark a movie as completed",
)
async def complete_movie(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token),
):
    logger.info(f"Mark movie as completed request received. User ID: {current_user['id']}, Movie ID: {movie_id}")
    return await watch_service.mark_as_completed(db, current_user["id"], movie_id)