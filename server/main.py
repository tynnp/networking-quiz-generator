from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import os
import json
import re
import time
from dotenv import load_dotenv
from google import genai
from pymongo.database import Database
from dtos import (
    AnalyzeOverallRequest,
    AnalyzeResultRequest,
    AnalyzeResultResponse,
    GenerateQuestionsRequest,
    Question,
    GenerateQuestionsResponse,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
    CreateUserRequest,
)
from database import get_db, init_db
from auth import (
    verify_password,
    create_access_token,
    verify_token,
    get_user_by_email,
    create_user,
    get_user_by_id,
    update_user,
    update_user_password,
    get_all_users,
    delete_user,
    lock_user,
    unlock_user,
)

load_dotenv()
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

security = HTTPBearer()

API_KEY = os.getenv("GOOGLE_API_KEY")
print("GOOGLE_API_KEY configured:", bool(API_KEY))

client: genai.Client | None = None
if API_KEY:
    client = genai.Client(api_key=API_KEY)

def build_prompt(params: GenerateQuestionsRequest) -> str:
    prompt = f"Tạo {params.count} câu hỏi trắc nghiệm về môn Mạng máy tính.\n\n"

    if params.chapter:
        prompt += f"Chương: {params.chapter}\n"

    if params.topics:
        prompt += "Chủ đề: " + ", ".join(params.topics) + "\n"

    if params.knowledgeTypes:
        mapping = {
            "concept": "Khái niệm",
            "property": "Tính chất",
            "mechanism": "Cơ chế hoạt động",
            "rule": "Quy tắc và tiêu chuẩn",
            "scenario": "Tình huống",
            "example": "Bài tập tính toán",
        }
        types = [mapping.get(t, t) for t in params.knowledgeTypes]
        prompt += "Loại kiến thức: " + ", ".join(types) + "\n"

    if params.difficulty:
        diff_mapping = {
            "easy": "Dễ",
            "medium": "Trung bình",
            "hard": "Khó",
        }
        prompt += f"Độ khó: {diff_mapping.get(params.difficulty, params.difficulty)}\n"

    prompt += f"""
    Tạo một mảng JSON gồm {params.count} câu hỏi trắc nghiệm theo đúng cấu trúc:

    {{
        "content": "Câu hỏi dạng văn bản",
        "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
        "correctAnswer": 0,
        "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
    }}

    YÊU CẦU BẮT BUỘC:
    1. Chỉ trả về JSON THUẦN — không thêm mô tả, không thêm giải thích bên ngoài.
    2. "correctAnswer" là chỉ số (index) của đáp án đúng trong mảng "options", bắt đầu từ 0.
    3. Các đáp án phải:
    - Có độ dài tương đương nhau (tránh trường hợp câu dài nhất là câu đúng).
    - Tránh bị đoán bằng cấu trúc bề ngoài (không quá chung chung, không quá đặc thù).
    - Không theo thứ tự cố định hoặc pattern nhận biết.
    - Nội dung các lựa chọn phải cùng kiểu (không trộn số liệu, định nghĩa, mô tả…).
    4. Đáp án đúng phải được đặt ở vị trí ngẫu nhiên.
    5. Không được để đáp án đúng nổi bật bằng các từ khóa như “tất cả”, “đúng nhất”, “chính xác nhất”, “câu trên đều sai”, trừ khi thuộc tính logic của kiến thức yêu cầu.
    6. "explanation" phải ngắn gọn, khách quan, chỉ giải thích tại sao đáp án đúng là đúng.

    Chỉ xuất JSON, không bọc trong dấu ``` và không thêm bất kỳ văn bản nào khác.
    """

    return prompt

def build_overall_analysis_prompt(params: AnalyzeOverallRequest) -> str:
    knowledge_payload = [item.model_dump() for item in params.knowledgeAnalysis]

    prompt = f"""
Bạn là trợ lý dạy học môn Mạng máy tính. Hãy phân tích TỔNG QUAN lịch sử làm bài trắc nghiệm của một sinh viên.

Thông tin tổng quan:
- Tên sinh viên: {params.studentName or "Không xác định"}
- Số bài đã làm: {params.attemptCount}
- Điểm trung bình: {params.avgScore:.1f}/100

Phân tích theo nhóm kiến thức (ở dạng JSON, mỗi phần tử mô tả một nhóm kiến thức với tỉ lệ trả lời đúng):
{json.dumps(knowledge_payload, ensure_ascii=False, indent=2)}

Yêu cầu:
1. Đưa ra nhận xét tổng quan về năng lực hiện tại (mạnh/yếu, mức độ nắm vững kiến thức, xu hướng tiến bộ hoặc chững lại nếu có thể suy ra).
2. Chỉ ra các nhóm kiến thức/chương/chủ đề mà sinh viên làm tốt.
3. Chỉ ra các nhóm kiến thức/chương/chủ đề mà sinh viên làm chưa tốt, cần ưu tiên ôn lại.
4. Đề xuất các chủ đề/chương nên ôn luyện tiếp theo.
5. Đề xuất một số hành động cụ thể để cải thiện (ví dụ: dạng bài nên luyện, chiến lược làm bài, cách phân bổ thời gian).

TRẢ VỀ JSON THUẦN với đúng schema sau, dùng tiếng Việt, không kèm bất kỳ giải thích hay text nào bên ngoài JSON:
{{
  "overallFeedback": "nhận xét tổng quan",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "suggestedTopics": ["chủ đề nên ôn 1", "chủ đề nên ôn 2"],
  "suggestedNextActions": ["hành động 1", "hành động 2"]
}}
"""

    return prompt

def build_analysis_prompt(params: AnalyzeResultRequest) -> str:
    questions_payload = []
    for q in params.questions:
        questions_payload.append(
            {
                "id": q.id,
                "content": q.content,
                "options": q.options,
                "correctAnswer": q.correctAnswer,
                "userAnswer": params.answers.get(q.id),
                "chapter": q.chapter,
                "topic": q.topic,
                "knowledgeType": q.knowledgeType,
                "difficulty": q.difficulty,
            }
        )

    prompt = f"""
Bạn là trợ lý dạy học môn Mạng máy tính. Hãy phân tích kết quả làm bài trắc nghiệm của một sinh viên.

Thông tin tổng quan:
- Tên đề: {params.quizTitle}
- Điểm: {params.score:.1f}/100
- Thời gian làm bài: {params.timeSpent} giây

Danh sách câu hỏi (ở dạng JSON, mỗi phần tử là một câu hỏi với cả đáp án đúng và đáp án học sinh chọn):
{json.dumps(questions_payload, ensure_ascii=False, indent=2)}

Yêu cầu:
1. Nhận xét tổng quan về mức độ hiểu bài, điểm mạnh/yếu tổng quát.
2. Chỉ ra những nhóm kiến thức, chương, chủ đề mà sinh viên làm tốt.
3. Chỉ ra những nhóm kiến thức, chương, chủ đề mà sinh viên hay sai, cần củng cố thêm.
4. Gợi ý một số chủ đề/chương nên ôn luyện tiếp theo.
5. Đề xuất một số hành động cụ thể để cải thiện (ví dụ: luyện thêm dạng bài nào, chiến lược làm bài...).

TRẢ VỀ JSON THUẦN với đúng schema sau, dùng tiếng Việt, không kèm bất kỳ giải thích hay text nào bên ngoài JSON:
{{
  "overallFeedback": "nhận xét tổng quan",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "suggestedTopics": ["chủ đề nên ôn 1", "chủ đề nên ôn 2"],
  "suggestedNextActions": ["hành động 1", "hành động 2"]
}}
"""

    return prompt

def parse_generated_questions(
    text: str, params: GenerateQuestionsRequest
) -> List[Question]:
    try:
        match = re.search(r"\[[\s\S]*\]", text)
        if not match:
            raise ValueError("No JSON array found in LLM response")

        raw_json = match.group(0)
        parsed = json.loads(raw_json)

        questions: List[Question] = []
        now_ms = int(time.time() * 1000)
        chapter = params.chapter or "Chương 1"
        topic = params.topics[0] if params.topics else "Tổng quan"
        knowledge_type = (params.knowledgeTypes[0] if params.knowledgeTypes else "concept")
        difficulty = params.difficulty or "medium"

        for index, q in enumerate(parsed):
            questions.append(
                Question(
                    id=f"q-{now_ms}-{index}",
                    content=q["content"],
                    options=q["options"],
                    correctAnswer=q["correctAnswer"],
                    chapter=chapter,
                    topic=topic,
                    knowledgeType=knowledge_type,  # type: ignore[arg-type]
                    difficulty=difficulty,  # type: ignore[arg-type]
                    explanation=q.get("explanation"),
                )
            )

        return questions
    except Exception as exc:  # noqa: BLE001
        print("Error parsing questions from LLM:", exc)
        raise

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Database = Depends(get_db)
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Remove "Bearer " prefix if present
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Dependency to check if user is admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    return current_user

@app.get("/")
def root():
    return {"status": "running"}

# Register endpoint disabled - only admin can create users
# @app.post("/api/auth/register", response_model=AuthResponse)
# def register(request: RegisterRequest, db: Database = Depends(get_db)):
#     ...

@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Database = Depends(get_db)):
    # Find user by email
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user is locked
    if user.get("isLocked", False):
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")
    
    # Verify password
    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],  # type: ignore[arg-type]
            dob=user.get("dob"),
            phone=user.get("phone"),
            isLocked=user.get("isLocked", False)
        )
    )

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],  # type: ignore[arg-type]
        dob=current_user.get("dob"),
        phone=current_user.get("phone"),
        isLocked=current_user.get("isLocked", False)
    )

@app.put("/api/auth/profile", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Update user profile information"""
    updates = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.dob is not None:
        updates["dob"] = request.dob
    if request.phone is not None:
        updates["phone"] = request.phone
    
    updated_user = update_user(db, current_user["id"], updates)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],  # type: ignore[arg-type]
        dob=updated_user.get("dob"),
        phone=updated_user.get("phone"),
        isLocked=updated_user.get("isLocked", False)
    )

@app.put("/api/auth/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(request.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    success = update_user_password(db, current_user["id"], request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update password")
    
    return {"message": "Password updated successfully"}

# Admin endpoints
@app.get("/api/admin/users", response_model=List[UserResponse])
def get_all_users_admin(
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Get all users (admin only)"""
    users = get_all_users(db)
    return [
        UserResponse(
            id=u["id"],
            email=u["email"],
            name=u["name"],
            role=u["role"],  # type: ignore[arg-type]
            dob=u.get("dob"),
            phone=u.get("phone"),
            isLocked=u.get("isLocked", False)
        )
        for u in users
    ]

@app.post("/api/admin/users", response_model=UserResponse)
def create_user_admin(
    request: CreateUserRequest,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = create_user(db, request.email, request.password, request.name, request.role)
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],  # type: ignore[arg-type]
        dob=user.get("dob"),
        phone=user.get("phone"),
        isLocked=user.get("isLocked", False)
    )

@app.delete("/api/admin/users/{user_id}")
def delete_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Delete a user (admin only)"""
    # Prevent deleting yourself
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@app.put("/api/admin/users/{user_id}/lock")
def lock_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Lock a user (admin only)"""
    # Prevent locking yourself
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot lock your own account")
    
    success = lock_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User locked successfully"}

@app.put("/api/admin/users/{user_id}/unlock")
def unlock_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Unlock a user (admin only)"""
    success = unlock_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User unlocked successfully"}

@app.post("/api/generate-questions", response_model=GenerateQuestionsResponse)
def generate_questions(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    if client is None:
        # Không có API key thì không thể gọi LLM
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY or GEMINI_API_KEY is not configured on the server",
        )

    prompt = build_prompt(request)

    try:
        gemini_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        generated_text = gemini_response.text
        questions = parse_generated_questions(generated_text, request)
        return GenerateQuestionsResponse(questions=questions)
    except HTTPException:
        # Đã có HTTPException cụ thể, ném lại cho FastAPI xử lý
        raise
    except Exception as exc:  # noqa: BLE001
        print("Error calling Gemini API:", exc)
        raise HTTPException(status_code=500, detail="Error calling Gemini API")

@app.post("/api/analyze-result", response_model=AnalyzeResultResponse)
def analyze_result(request: AnalyzeResultRequest) -> AnalyzeResultResponse:
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY or GEMINI_API_KEY is not configured on the server",
        )

    prompt = build_analysis_prompt(request)

    try:
        gemini_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        generated_text = gemini_response.text or ""

        try:
            data = json.loads(generated_text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", generated_text)
            if not match:
                raise ValueError("No JSON object found in LLM response")
            data = json.loads(match.group(0))

        return AnalyzeResultResponse(
            overallFeedback=data.get(
                "overallFeedback", "Không thể phân tích kết quả bài làm."
            ),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestedTopics=data.get("suggestedTopics", []),
            suggestedNextActions=data.get("suggestedNextActions", []),
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print("Error calling Gemini API for analysis:", exc)
        raise HTTPException(
            status_code=500, detail="Error calling Gemini API for analysis"
        )

@app.post("/api/analyze-overall", response_model=AnalyzeResultResponse)
def analyze_overall(request: AnalyzeOverallRequest) -> AnalyzeResultResponse:
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY or GEMINI_API_KEY is not configured on the server",
        )

    prompt = build_overall_analysis_prompt(request)

    try:
        gemini_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        generated_text = gemini_response.text or ""

        try:
            data = json.loads(generated_text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", generated_text)
            if not match:
                raise ValueError("No JSON object found in LLM response")
            data = json.loads(match.group(0))

        return AnalyzeResultResponse(
            overallFeedback=data.get(
                "overallFeedback", "Không thể phân tích tổng quan lịch sử làm bài."
            ),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestedTopics=data.get("suggestedTopics", []),
            suggestedNextActions=data.get("suggestedNextActions", []),
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print("Error calling Gemini API for overall analysis:", exc)
        raise HTTPException(
            status_code=500,
            detail="Error calling Gemini API for overall analysis",
        )