from typing import List, Optional, Literal, Dict, Generic, TypeVar, Any
from datetime import datetime
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class GenerateQuestionsRequest(BaseModel):
    chapter: Optional[str] = Field(None, max_length=200)
    topics: Optional[List[str]] = None
    knowledgeTypes: Optional[List[str]] = None
    difficulty: Optional[str] = Field(None, max_length=20)
    count: int = Field(..., gt=0, le=50)

class Question(BaseModel):
    id: str = Field(..., max_length=100)
    content: str = Field(..., max_length=2000)
    options: List[str]
    correctAnswer: int
    chapter: str = Field(..., max_length=200)
    topic: str = Field(..., max_length=200)
    knowledgeType: Literal["concept", "property", "mechanism", "rule", "scenario", "example"]
    difficulty: Literal["easy", "medium", "hard"]
    explanation: Optional[str] = Field(None, max_length=1000)

class GenerateQuestionsResponse(BaseModel):
    questions: List[Question]

class AnalyzeResultRequest(BaseModel):
    quizTitle: str = Field(..., max_length=150)
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
    knowledgeType: str = Field(..., max_length=50)
    chapter: str = Field(..., max_length=200)
    topic: str = Field(..., max_length=200)
    totalQuestions: int
    correctAnswers: int
    accuracy: float

class AnalyzeOverallRequest(BaseModel):
    studentName: Optional[str] = Field(None, max_length=100)
    attemptCount: int
    avgScore: float
    knowledgeAnalysis: List[KnowledgeAnalysisItem]

class ProgressDataPoint(BaseModel):
    date: str
    score: float
    quizTitle: str

class AnalyzeProgressRequest(BaseModel):
    studentName: Optional[str] = Field(None, max_length=100)
    chapter: str = Field(..., max_length=200)
    progressData: List[ProgressDataPoint]
    avgScore: float
    trend: str  # "improving", "declining", "stable"

class LoginRequest(BaseModel):
    email: str = Field(..., max_length=100)
    password: str = Field(..., max_length=128)

class SendOTPRequest(BaseModel):
    email: str = Field(..., max_length=100)
    name: str = Field(..., max_length=100)

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., max_length=100)

class ResetPasswordRequest(BaseModel):
    email: str = Field(..., max_length=100)
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=128)

class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., max_length=100)
    otp: str = Field(..., min_length=6, max_length=6)

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["student", "admin"]
    dob: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=10)
    isLocked: bool = False

class CreateUserRequest(BaseModel):
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., max_length=100)
    role: Literal["student", "admin"] = "student"

class UpdateUserRoleRequest(BaseModel):
    role: Literal["student", "admin"]

class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=128)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    dob: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=10)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)

# Quiz DTOs
class QuizSettings(BaseModel):
    chapter: Optional[str] = Field(None, max_length=200)
    topic: Optional[str] = Field(None, max_length=200)
    knowledgeTypes: Optional[List[str]] = None
    difficulty: Optional[str] = Field(None, max_length=20)
    questionCount: int

class CreateQuizRequest(BaseModel):
    title: str = Field(..., max_length=150)
    description: str = Field("", max_length=500)
    questions: List[Question]
    duration: int = Field(..., gt=0, le=600)
    settings: QuizSettings

class UpdateQuizRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    duration: Optional[int] = Field(None, gt=0, le=600)
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
    content: Optional[str] = Field(None, max_length=2000)
    options: Optional[List[str]] = None
    correctAnswer: Optional[int] = None
    chapter: Optional[str] = Field(None, max_length=200)
    topic: Optional[str] = Field(None, max_length=200)
    knowledgeType: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[str] = Field(None, max_length=20)
    explanation: Optional[str] = Field(None, max_length=1000)

# Quiz Attempt DTOs
class CreateAttemptRequest(BaseModel):
    quizId: str = Field(..., max_length=100)
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

# Analysis History DTOs
class AnalysisResultData(BaseModel):
    overallFeedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestedTopics: List[str]
    suggestedNextActions: List[str]

class AnalysisHistoryResponse(BaseModel):
    id: str
    userId: str
    analysisType: Literal["result", "overall", "progress"]
    title: str
    result: AnalysisResultData
    context: Optional[Dict[str, Any]] = None
    createdAt: str

# Quiz Discussion DTOs
class AddToDiscussionRequest(BaseModel):
    quizId: str = Field(..., max_length=100)

class QuizDiscussionResponse(BaseModel):
    id: str
    quizId: str
    quizTitle: str
    quizDescription: Optional[str] = None
    addedBy: str
    addedByName: str
    addedAt: str
    messageCount: int

class DiscussionMessageResponse(BaseModel):
    id: str
    quizId: str
    userId: str
    userName: str
    content: str
    timestamp: str

class GeminiSettingsRequest(BaseModel):
    model: Optional[str] = Field(None, max_length=50)
    apiKey: Optional[str] = Field(None, max_length=200)

class GeminiSettingsResponse(BaseModel):
    model: Optional[str] = None
    apiKey: Optional[str] = None

class SystemSettingsResponse(BaseModel):
    defaultKeyLocked: bool = False

class LockDefaultKeyRequest(BaseModel):
    locked: bool