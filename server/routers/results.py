# server/routers/results.py
from fastapi import APIRouter, Depends, Query
from typing import Optional
from pydantic import BaseModel
from server.database import db
from server.auth import get_current_user, UserInToken

router = APIRouter(prefix="/results", tags=["results"])

class ResultOut(BaseModel):
    id: str
    user_id: str
    exam_id: str
    exam_title: str
    score: float
    submitted_at: Optional[str] = None

@router.get("/me", response_model=list[ResultOut])
def get_my_results(
    search: Optional[str] = Query(None, description="Search in exam title"),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Return results belonging to current user.
    Optionally search by exam_title (case-insensitive).
    """
    query = {"user_id": current_user.id}
    if search:
        query["exam_title"] = {"$regex": search, "$options": "i"}

    cursor = db.results.find(query).sort("submitted_at", -1)
    out = []
    for r in cursor:
        out.append({
            "id": str(r.get("_id")),
            "user_id": r.get("user_id"),
            "exam_id": r.get("exam_id"),
            "exam_title": r.get("exam_title"),
            "score": r.get("score"),
            "submitted_at": r.get("submitted_at")
        })
    return out
