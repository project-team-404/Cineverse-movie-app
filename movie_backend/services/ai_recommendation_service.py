from sqlalchemy.ext.asyncio import AsyncSession
from movie_app.movie_backend.schemas.ai_recommendation import (
    AiRequest
)
from movie_app.movie_backend.ai.services.ai_recommendation import AI_Recommendation

async def get_ai_recommendation(request:AiRequest,db: AsyncSession,current_user):
    result = await AI_Recommendation(current_user["id"],request.message,db)
    return result