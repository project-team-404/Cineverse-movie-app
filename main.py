from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from scalar_fastapi import get_scalar_api_reference

from movie_backend.database.database import init_db

from movie_backend.routes.auth import router as auth
from movie_backend.routes.movies import router as movies
from movie_backend.routes.genres import router as genres
from movie_backend.routes.admin import router as admin
from movie_backend.routes.favorite import router as favorite
from movie_backend.routes.review import router as review
from movie_backend.routes.watchlist import router as watchlist
from movie_backend.routes.profile import router as profile




from movie_backend.models.user import User
from movie_backend.models.genre import Genre
from movie_backend.models.movie import Movie
from movie_backend.models.movie_image import MovieImage
from movie_backend.models.watchlist import Watchlist
from movie_backend.models.profile import Profile

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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:63342",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "https://cineverse-movie-app-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def log_requests(request: Request, call_next):
    start = time.perf_counter()

    response = await call_next(request)

    end = time.perf_counter()

    print(f"Request time: {end - start:.4f} seconds")

    return response


@app.get("/")
async def root():
    return {
        "message": "Movie API is running",
        "docs": "/scalar"
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
app.include_router(watchlist)
app.include_router(profile)
