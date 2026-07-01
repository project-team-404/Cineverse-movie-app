from langchain_core.tools import tool

from movie_backend.ai.vectorstore.store import vector_store

retriever = vector_store.as_retriever(
    search_kwargs={"k": 5}
)


@tool
def rag(query: str):
    """
    Search the movie vector database.

    Use this tool whenever you need movie recommendations or movie IDs.

    This tool returns the movie_id, title, genre and description.
    The returned movie_id is the only valid movie ID.
    Never invent movie IDs.
    """

    docs = retriever.invoke(query)

    results = []

    for doc in docs:
        results.append(
            {
                "movie_id": doc.metadata["movie_id"],
                "content": doc.page_content.strip()
            }
        )

    return results