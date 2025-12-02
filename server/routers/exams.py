# server/routers/exams.py
from fastapi import APIRouter, Depends, Query
from typing import Optional
from pydantic import BaseModel
from server.database import db
from server.auth import get_current_user, UserInToken 

router = APIRouter(prefix="/exams", tags=["exams"])

class ExamOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None

class PaginatedExams(BaseModel):
    data: list
    total: int
    page: int
    page_size: int


@router.get("/", response_model=PaginatedExams)
def list_exams(
    search: Optional[str] = Query(None, description="Search in exam title"),
    user_id: Optional[str] = Query(None, description="Filter by creator user id"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    _: UserInToken = Depends(get_current_user)
):
    query = {}

    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    if user_id:
        query["created_by"] = user_id

    skip = (page - 1) * page_size

    exams_cursor = (
        db.exams.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("created_at", -1)
    )

    exams = []
    for e in exams_cursor:
        exams.append({
            "id": str(e["_id"]),
            "title": e.get("title"),
            "description": e.get("description"),
            "created_by": e.get("created_by"),
            "created_at": e.get("created_at")
        })

    total = db.exams.count_documents(query)

    return {
        "data": exams,
        "total": total,
        "page": page,
        "page_size": page_size
    }
