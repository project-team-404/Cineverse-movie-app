from langchain_core.tools import tool

from movie_backend.ai.vectorstore.store import vector_store

retriever = vector_store.as_retriever(
    search_kwargs={"k": 10}
)


@tool
def rag(query: str):
    """
    Search the movie vector database.

    Returns the top 10 most relevant movies for the given query.

    Use this tool whenever movie recommendations or movie IDs are required.

    Each result contains:
    - movie_id
    - title
    - genre
    - description

    The returned movie_id is the only valid movie ID.
    Never invent or modify movie IDs.
    Always use the IDs returned by this tool.
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