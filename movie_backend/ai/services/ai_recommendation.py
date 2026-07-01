from langchain_core.messages import HumanMessage
from pydantic import ValidationError

from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.ai.graph.builder import build_graph

from movie_backend.ai.tools.history import (
    create_user_history_genre_count_tool
)

from movie_backend.ai.tools.favorite import (
    create_user_favorite_genre_count_tool
)

from movie_backend.ai.tools.rag import rag

from movie_backend.schemas.ai_recommendation import (
    AiResponse
)


async def AI_Recommendation(
    user_id: int,
    user_query: str,
    db: AsyncSession
):
    history_tool = create_user_history_genre_count_tool(
        db=db,
        user_id=user_id
    )

    favorite_tool = create_user_favorite_genre_count_tool(
        db=db,
        user_id=user_id
    )

    rag_tool = rag

    tools = [
        history_tool,
        favorite_tool,
        rag_tool
    ]

    compiled_graph = build_graph(tools)

    result = await compiled_graph.ainvoke(
        {
            "messages": [
                HumanMessage(content=user_query)
            ]
        }
    )

    ai_message = result["messages"][-1]

    print("=" * 80)
    print("RAW AI RESPONSE")
    print(ai_message.content)
    print("=" * 80)

    try:
        response = AiResponse.model_validate_json(
            ai_message.content
        )
        return response

    except ValidationError as e:
        print("FAILED TO PARSE AI RESPONSE")
        print(e)
        raise ValueError(
            f"LLM did not return valid JSON.\n\nResponse:\n{ai_message.content}"
        )