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

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["student", "admin"]
    dob: Optional[str] = None
    phone: Optional[str] = None
    isLocked: bool = False

class CreateUserRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str
    role: Literal["student", "admin"] = "student"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)