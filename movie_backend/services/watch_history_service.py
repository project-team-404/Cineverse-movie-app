from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
from fastapi import HTTPException, status

from movie_backend.models.watch_history import WatchHistory
from movie_backend.schemas.watch_history_schema import WatchHistoryRequest


def now():
    """Return current UTC time as naive datetime (no timezone info) for PostgreSQL TIMESTAMP."""
    return datetime.utcnow()


# ── Add or Update Watch History ───────────────────────────────────────────────

async def upsert_watch_history(
    db: AsyncSession,
    user_id: int,
    payload: WatchHistoryRequest,
) -> WatchHistory:
    try:
        result = await db.execute(
            select(WatchHistory).where(
                WatchHistory.user_id == user_id,
                WatchHistory.movie_id == payload.movie_id,
            )
        )
        record = result.scalars().first()

        if record:
            record.progress = payload.progress
            record.completed = payload.completed
            record.watched_at = now()
        else:
            record = WatchHistory(
                user_id=user_id,
                movie_id=payload.movie_id,
                progress=payload.progress,
                completed=payload.completed,
                watched_at=now(),
            )
            db.add(record)

        await db.commit()
        await db.refresh(record)
        return record

    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving watch history: {str(e)}",
        )


# ── Get All Watch History for a User ─────────────────────────────────────────

async def get_user_watch_history(
    db: AsyncSession,
    user_id: int,
) -> list[WatchHistory]:
    try:
        result = await db.execute(
            select(WatchHistory)
            .where(WatchHistory.user_id == user_id)
            .order_by(WatchHistory.watched_at.desc())
        )
        return result.scalars().all()

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching watch history: {str(e)}",
        )


# ── Get Single Movie History ──────────────────────────────────────────────────

async def get_movie_watch_history(
    db: AsyncSession,
    user_id: int,
    movie_id: int,
) -> WatchHistory:
    try:
        result = await db.execute(
            select(WatchHistory).where(
                WatchHistory.user_id == user_id,
                WatchHistory.movie_id == movie_id,
            )
        )
        record = result.scalars().first()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No watch history found for movie {movie_id}.",
            )

        return record

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching movie history: {str(e)}",
        )


# ── Continue Watching ─────────────────────────────────────────────────────────

async def get_continue_watching(
    db: AsyncSession,
    user_id: int,
) -> list[WatchHistory]:
    try:
        result = await db.execute(
            select(WatchHistory)
            .where(
                WatchHistory.user_id == user_id,
                WatchHistory.completed == False,  # noqa: E712
                WatchHistory.progress > 0,
            )
            .order_by(WatchHistory.watched_at.desc())
        )
        return result.scalars().all()

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching continue watching list: {str(e)}",
        )


# ── Mark Movie as Completed ───────────────────────────────────────────────────

async def mark_as_completed(
    db: AsyncSession,
    user_id: int,
    movie_id: int,
) -> WatchHistory:
    try:
        result = await db.execute(
            select(WatchHistory).where(
                WatchHistory.user_id == user_id,
                WatchHistory.movie_id == movie_id,
            )
        )
        record = result.scalars().first()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No watch history found for movie {movie_id}. Start watching first.",
            )

        record.completed = True
        record.watched_at = now()

        await db.commit()
        await db.refresh(record)
        return record

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while marking movie as completed: {str(e)}",
        )