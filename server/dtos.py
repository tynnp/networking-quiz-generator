from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class GenerateQuestionsRequest(BaseModel):
    chapter: Optional[str] = None
    topics: Optional[List[str]] = None
    knowledgeTypes: Optional[List[str]] = None
    difficulty: Optional[str] = None
    count: int = Field(..., gt=0, le=50)

class Question(BaseModel):
    id: str
    content: str
    options: List[str]
    correctAnswer: int
    chapter: str
    topic: str
    knowledgeType: Literal["concept", "property", "mechanism", "rule", "scenario", "example"]
    difficulty: Literal["easy", "medium", "hard"]
    explanation: Optional[str] = None

class GenerateQuestionsResponse(BaseModel):
    questions: List[Question]