from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.models.movie import Movie
from movie_backend.models.review import Review

from movie_backend.schemas.review_schema import (
    ReviewCreate,
    ReviewUpdate
)


async def create_review_service(
    movie_id: int,
    request: ReviewCreate,
    db: AsyncSession,
    current_user
):
    statement = select(Movie).where(
        Movie.id == movie_id
    )

    result = await db.execute(statement)

    movie = result.scalar_one_or_none()

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )

    review = Review(
        **request.model_dump(),
        user_id=current_user["id"],
        movie_id=movie_id
    )

    db.add(review)

    await db.commit()

    await db.refresh(review)

    return review


async def update_review_service(
    review_id: int,
    request: ReviewUpdate,
    db: AsyncSession,
    current_user
):
    statement = select(Review).where(
        Review.id == review_id
    )

    result = await db.execute(statement)

    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    if review.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    for key, value in request.model_dump(
        exclude_unset=True
    ).items():
        setattr(review, key, value)

    await db.commit()

    await db.refresh(review)

    return review


async def delete_review_service(
    review_id: int,
    db: AsyncSession,
    current_user
):
    statement = select(Review).where(
        Review.id == review_id
    )

    result = await db.execute(statement)

    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    if review.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    await db.delete(review)

    await db.commit()

    return {
        "message": "Review deleted successfully"
    }


async def get_reviews_service(
    movie_id: int,
    db: AsyncSession
):
    statement = select(Review).where(
        Review.movie_id == movie_id
    )

    result = await db.execute(statement)

    return result.scalars().all()