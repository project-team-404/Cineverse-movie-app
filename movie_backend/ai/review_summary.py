from dotenv import load_dotenv

from fastapi import HTTPException

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.models.movie import Movie
from movie_backend.models.review import Review

load_dotenv()

system = SystemMessage(
    content="""
You are a movie review summarizer.

Given the movie name, overall rating, and user reviews:
- Generate a concise summary in 3-5 sentences.
- Mention the overall audience sentiment.
- Highlight strengths and weaknesses.
- Do not repeat reviews verbatim.
- Return only the summary.
- if review not found use the movie details alone 
"""
)

prompt = PromptTemplate.from_template(
    """
User Reviews:
{review}

Overall Rating:
{overall_rating}

Movie:
{movie}
"""
)

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    max_tokens=300,
)


async def summary_review_service(movie_id: int, db: AsyncSession):

    movie_query = select(Movie).where(Movie.id == movie_id)
    movie_result = await db.execute(movie_query)
    movie = movie_result.scalar_one_or_none()

    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")


    review_query = (
        select(Review)
        .where(
            Review.movie_id == movie_id,
            func.length(Review.content) > 30
        )
        .limit(10)
    )

    review_result = await db.execute(review_query)
    reviews = review_result.scalars().all()

    if not reviews:
        content = "No reviews found."
    else:
        content = "\n".join(review.content for review in reviews)

    response = prompt.invoke(
        {
            "review": content,
            "overall_rating": movie.rating,
            "movie": movie.title,
        }
    )

    human = HumanMessage(content=response.to_string())

    try:
        final_response = await llm.ainvoke([system, human])
        return {"summary_message":final_response.content}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )