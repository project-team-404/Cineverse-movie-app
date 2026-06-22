import os

from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)

from sqlalchemy.orm import declarative_base

load_dotenv()

host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
dbname = os.getenv("DB_NAME")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

DATABASE_URL = (
    f"postgresql+asyncpg://"
    f"{user}:{password}@{host}:{port}/{dbname}"
)
print("DATABASE_URL =", DATABASE_URL)
engine = create_async_engine(
    DATABASE_URL,
    echo=True
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False
)

Base = declarative_base()


async def init_db():

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():

    async with SessionLocal() as db:
        yield db