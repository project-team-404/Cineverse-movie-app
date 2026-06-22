from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference

from movie_backend.database.database import init_db

from movie_backend.routes.auth import router as auth
from movie_backend.routes.movies import router as movies
from movie_backend.routes.genres import router as genres
from movie_backend.routes.admin import router as admin
from movie_backend.routes.favorite import router as favorite
from movie_backend.routes.review import router as review

from movie_backend.models.user import User
from movie_backend.models.genre import Genre
from movie_backend.models.movie import Movie
from movie_backend.models.movie_image import MovieImage

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Welcome to lifespan")

    await init_db()

    yield

    print("Bye from lifespan")


app = FastAPI(
    title="Movie API",
    version="1.0",
    description="This API provides access to Movie",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.middleware("http")
async def log_requests(
    request: Request,
    call_next
):
    start = time.perf_counter()

    response = await call_next(request)

    end = time.perf_counter()

    print(end - start)

    return response


@app.get("/")
async def root():
    return {
        "message": "Movie API is running"
    }


@app.get("/scalar", include_in_schema=False)
def scalar():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API"
    )


app.include_router(auth)
app.include_router(movies)
app.include_router(genres)
app.include_router(admin)
app.include_router(favorite)
app.include_router(review)