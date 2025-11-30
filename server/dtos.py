from typing import List, Optional, Literal, Dict
from datetime import datetime
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

# Quiz DTOs
class QuizSettings(BaseModel):
    chapter: Optional[str] = None
    topic: Optional[str] = None
    knowledgeTypes: Optional[List[str]] = None
    difficulty: Optional[str] = None
    questionCount: int

class CreateQuizRequest(BaseModel):
    title: str
    description: str = ""
    questions: List[Question]
    duration: int = Field(..., gt=0)
    settings: QuizSettings

class UpdateQuizRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0)
    questions: Optional[List[Question]] = None

class QuizResponse(BaseModel):
    id: str
    title: str
    description: str
    questions: List[Question]
    duration: int
    createdBy: str
    createdAt: str
    settings: QuizSettings

class UpdateQuestionRequest(BaseModel):
    content: Optional[str] = None
    options: Optional[List[str]] = None
    correctAnswer: Optional[int] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    knowledgeType: Optional[str] = None
    difficulty: Optional[str] = None
    explanation: Optional[str] = None

# Quiz Attempt DTOs
class CreateAttemptRequest(BaseModel):
    quizId: str
    answers: Dict[str, int]
    score: float
    timeSpent: int

class AttemptResponse(BaseModel):
    id: str
    quizId: str
    studentId: str
    answers: Dict[str, int]
    score: float
    completedAt: str
    timeSpent: int