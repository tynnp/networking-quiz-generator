from typing import List, Optional, Literal, Dict
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

class AnalyzeResultRequest(BaseModel):
    quizTitle: str
    questions: List[Question]
    answers: Dict[str, int]
    score: float
    timeSpent: int

class AnalyzeResultResponse(BaseModel):
    overallFeedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestedTopics: List[str]
    suggestedNextActions: List[str]

class KnowledgeAnalysisItem(BaseModel):
    knowledgeType: str
    chapter: str
    topic: str
    totalQuestions: int
    correctAnswers: int
    accuracy: float

class AnalyzeOverallRequest(BaseModel):
    studentName: Optional[str] = None
    attemptCount: int
    avgScore: float
    knowledgeAnalysis: List[KnowledgeAnalysisItem]