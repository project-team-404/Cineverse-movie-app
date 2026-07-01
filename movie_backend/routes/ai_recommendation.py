from fastapi import APIRouter,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from movie_backend.models.movie import Movie

from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token

from movie_backend.schemas.ai_recommendation import (
    AiResponse,
    AiRequest
)
from movie_backend.ai.vectorstore.helpers import add_movie
from movie_backend.ai.vectorstore.store import vector_store

from movie_backend.services.ai_recommendation_service import get_ai_recommendation

router = APIRouter(
    prefix="/ai_recommendation",
    tags=["Ai_Recommendation"]
)

@router.post("/",response_model=AiResponse)
async def ai_recommendation(
        request: AiRequest,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(verify_token)
):
    return await get_ai_recommendation(request,db, current_user)


@router.post("/sync-chroma")
async def sync_chroma(db: AsyncSession = Depends(get_db)):
    # Clear existing documents (optional)
    data = vector_store.get()

    if data["ids"]:
        vector_store.delete(ids=data["ids"])

    # Fetch all movies with relationships
    result = await db.execute(
        select(Movie).options(
            selectinload(Movie.genre),
            selectinload(Movie.images)
        )
    )

    movies = result.scalars().all()

    # Add all movies to ChromaDB
    for movie in movies:
        add_movie(movie)

    return {
        "message": "ChromaDB synchronized successfully",
        "movies_synced": len(movies),
        "documents_in_chroma": vector_store._collection.count()
    }