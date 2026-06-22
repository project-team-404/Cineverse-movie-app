from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token

from movie_backend.schemas.review_schema import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse
)

from movie_backend.schemas.response_schema import (
    MessageResponse
)

from movie_backend.services.review_service import (
    create_review_service,
    update_review_service,
    delete_review_service,
    get_reviews_service
)

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.post(
    "/{movie_id}",
    response_model=ReviewResponse
)
async def create_review(
    movie_id: int,
    request: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await create_review_service(
        movie_id,
        request,
        db,
        current_user
    )


@router.patch(
    "/{review_id}",
    response_model=ReviewResponse
)
async def update_review(
    review_id: int,
    request: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await update_review_service(
        review_id,
        request,
        db,
        current_user
    )


@router.delete(
    "/{review_id}",
    response_model=MessageResponse
)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await delete_review_service(
        review_id,
        db,
        current_user
    )


@router.get(
    "/{movie_id}",
    response_model=list[ReviewResponse]
)
async def get_reviews(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_reviews_service(
        movie_id,
        db
    )