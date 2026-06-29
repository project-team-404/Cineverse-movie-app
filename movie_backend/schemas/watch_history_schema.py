from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Request ──────────────────────────────────────────────────────────────────

class WatchHistoryRequest(BaseModel):
    movie_id: int = Field(..., gt=0, description="ID of the movie being watched")
    progress: int = Field(default=0, ge=0, description="Seconds watched so far")
    completed: bool = Field(default=False, description="Whether the movie was fully watched")


# ── Response ─────────────────────────────────────────────────────────────────

class WatchHistoryResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    watched_at: datetime
    progress: int
    completed: bool

    model_config = {"from_attributes": True}


# ── Update (PATCH) ────────────────────────────────────────────────────────────

class WatchHistoryUpdate(BaseModel):
    progress: Optional[int] = Field(None, ge=0, description="Updated progress in seconds")
    completed: Optional[bool] = Field(None, description="Mark as completed")