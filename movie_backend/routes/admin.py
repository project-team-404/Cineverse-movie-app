from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File
)
from sqlalchemy.ext.asyncio import AsyncSession

from movie_app.movie_backend.database.database import get_db
from movie_app.movie_backend.util.helpers import verify_token

from movie_app.movie_backend.schemas.movie_schema import (
    MovieCreate,
    MovieUpdate,
    MovieResponse
)

from movie_app.movie_backend.schemas.genre_schema import (
    GenreCreate,
    GenreUpdate,
    GenreResponse
)

from movie_app.movie_backend.schemas.movie_image_schema import (
    MovieImageResponse
)

from movie_app.movie_backend.schemas.response_schema import (
    MessageResponse
)

from movie_app.movie_backend.services.admin_service import (
    create_movie_service,
    update_movie_service,
    delete_movie_service,
    create_genre_service,
    update_genre_service,
    delete_genre_service,
    add_movie_image_service,
    delete_movie_image_service
)
from movie_app.movie_backend.util.helpers import rate_limit
import logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.post(
    "/movies",
    response_model=MovieResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def create_movie(
    request: MovieCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Create movie request received by user {current_user.id}")
    return await create_movie_service(
        request,
        db,
        current_user
    )


@router.patch(
    "/movies/{movie_id}",
    response_model=MovieResponse,
    dependencies=[Depends(rate_limit(15, 60))]
)
async def update_movie(
    movie_id: int,
    request: MovieUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Update movie request received. Movie ID: {movie_id}, User ID: {current_user.id}")
    return await update_movie_service(
        movie_id,
        request,
        db,
        current_user
    )


@router.delete(
    "/movies/{movie_id}",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def delete_movie(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Delete movie request received. Movie ID: {movie_id}, User ID: {current_user.id}")
    return await delete_movie_service(
        movie_id,
        db,
        current_user
    )


@router.post(
    "/genres",
    response_model=GenreResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def create_genre(
    request: GenreCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    
    logger.info(f"Create genre request received by user {current_user.id}")
    return await create_genre_service(
        request,
        db,
        current_user
    )


@router.patch(
    "/genres/{genre_id}",
    response_model=GenreResponse,
    dependencies=[Depends(rate_limit(15, 60))]
)
async def update_genre(
    genre_id: int,
    request: GenreUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Update genre request received. Genre ID: {genre_id}, User ID: {current_user.id}")
    return await update_genre_service(
        genre_id,
        request,
        db,
        current_user
    )


@router.delete(
    "/genres/{genre_id}",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def delete_genre(
    genre_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Delete genre request received. Genre ID: {genre_id}, User ID: {current_user.id}")
    return await delete_genre_service(
        genre_id,
        db,
        current_user
    )


@router.post(
    "/movies/{movie_id}/images",
    response_model=MovieImageResponse,
    dependencies=[Depends(rate_limit(5, 60))]
)
async def add_movie_image(
    movie_id: int,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Add movie image request received. Movie ID: {movie_id}, Filename: {image.filename}, User ID: {current_user.id}")
    return await add_movie_image_service(
        movie_id,
        image,
        db,
        current_user
    )


@router.delete(
    "/movie-images/{image_id}",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(10, 60))]
)
async def delete_movie_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    logger.info(f"Delete movie image request received. Image ID: {image_id}, User ID: {current_user.id}")
    return await delete_movie_image_service(
        image_id,
        db,
        current_user
    )