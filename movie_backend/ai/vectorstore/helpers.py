from langchain_core.documents import Document

from movie_backend.ai.vectorstore.store import vector_store
from movie_backend.models.movie import Movie


def movie_to_document(movie: Movie) -> Document:
    genre_name = movie.genre.name if movie.genre else "Unknown"

    return Document(
        page_content=f"""
            Title: {movie.title}
            
            Genre: {genre_name}
            
            Description:
            {movie.description}
            """,
        metadata={
            "movie_id": movie.id
        }
    )


def add_movie(movie: Movie):
    document = movie_to_document(movie)

    vector_store.add_documents(
        documents=[document],
        ids=[str(movie.id)]
    )


def update_movie(movie: Movie):
    vector_store.delete(
        ids=[str(movie.id)]
    )

    add_movie(movie)


def delete_movie(movie_id: int):
    vector_store.delete(
        ids=[str(movie_id)]
    )