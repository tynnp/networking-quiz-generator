# Copyright 2025 Nguyễn Ngọc Phú Tỷ
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from fastapi import FastAPI, HTTPException, Depends, Header, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json
import re
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pymongo.database import Database
from email_service import generate_otp, send_otp_email, send_reset_password_otp_email, validate_email_address

from dtos import (
    AnalyzeOverallRequest,
    AnalyzeProgressRequest,
    AnalyzeResultRequest,
    AnalyzeResultResponse,
    GenerateQuestionsRequest,
    Question,
    GenerateQuestionsResponse,
    LoginRequest,
    SendOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RegisterRequest,
    AuthResponse,
    UserResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
    CreateUserRequest,
    UpdateUserRoleRequest,
    AdminResetPasswordRequest,
    CreateQuizRequest,
    UpdateQuizRequest,
    QuizResponse,
    QuizSettings,
    UpdateQuestionRequest,
    CreateAttemptRequest,
    AttemptResponse,
    PaginatedResponse,
    AnalysisHistoryResponse,
    AnalysisResultData,
    AddToDiscussionRequest,
    QuizDiscussionResponse,
    DiscussionMessageResponse,
    GeminiSettingsRequest,
    GeminiSettingsResponse,
    SystemSettingsResponse,
    LockDefaultKeyRequest,
)

from database import (
    get_db,
    init_db,
    create_analysis_history,
    get_analysis_history_by_user,
    get_analysis_history_by_id,
    delete_analysis_history,
    add_quiz_to_discussion,
    get_quiz_discussions,
    get_quiz_discussion_by_quiz_id,
    remove_quiz_from_discussion,
    create_discussion_message,
    get_discussion_messages,
    delete_discussion_messages_by_quiz,
    create_otp,
    verify_otp,
    delete_otp,
    get_user_settings,
    save_user_settings,
    get_system_settings,
    save_system_settings,
)

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
    create_quiz,
    get_quiz_by_id,
    get_all_quizzes,
    update_quiz,
    delete_quiz,
    update_question_in_quiz,
    delete_question_from_quiz,
    create_attempt,
    get_attempt_by_id,
    get_attempts_by_student,
    get_attempts_by_quiz,
)

load_dotenv()
security_scheme = HTTPBearer()

tags_metadata = [
    {"name": "Xác thực", "description": "Đăng nhập, đăng ký và quản lý hồ sơ người dùng"},
    {"name": "Quản lý đề thi", "description": "Tạo, xem, sửa, xóa đề thi trắc nghiệm"},
    {"name": "Quản lý câu hỏi", "description": "Sửa, xóa câu hỏi trong đề thi"},
    {"name": "Làm bài thi", "description": "Nộp bài làm và xem kết quả bài thi"},
    {"name": "Tính năng AI", "description": "Tạo câu hỏi, phân tích kết quả bằng AI"},
    {"name": "Lịch sử phân tích", "description": "Quản lý lịch sử phân tích AI"},
    {"name": "Quản lý người dùng", "description": "Chức năng quản trị viên - quản lý tài khoản người dùng"},
    {"name": "Chat cộng đồng", "description": "Chat chung và chat riêng với các thành viên"},
    {"name": "Thảo luận đề thi", "description": "Thảo luận về từng đề thi với cộng đồng"},
    {"name": "Cài đặt", "description": "Cài đặt cấu hình AI của người dùng"},
]

app = FastAPI(
    title="Networking Quiz Generator API",
    description="API cho hệ thống trắc nghiệm môn Mạng Máy Tính",
    version="2.4.0",
    openapi_tags=tags_metadata
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
security = HTTPBearer()

API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
print("GOOGLE_API_KEY configured:", bool(API_KEY))
print("GEMINI_MODEL_NAME configured:", MODEL_NAME)

GENERATION_CONFIG_QUESTIONS = types.GenerateContentConfig(
    temperature=0.3,
    top_p=0.95,
    top_k=40,
)

GENERATION_CONFIG_ANALYSIS = types.GenerateContentConfig(
    temperature=0.5,
    top_p=0.95,
    top_k=40,
)

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

    if not params.difficulty or params.difficulty == "":
        prompt += "Độ khó: Hỗn hợp (Yêu cầu: 30% Dễ, 40% Trung bình, 30% Khó). Các câu hỏi phải xuất hiện ngẫu nhiên theo độ khó, không gom nhóm.\n"
    else:
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
        "difficulty": "easy" | "medium" | "hard",
        "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
    }}

    YÊU CẦU VỀ TÍNH CHÍNH XÁC (BẮT BUỘC):
    1. Mọi thông tin kỹ thuật PHẢI dựa trên chuẩn RFC, IEEE, hoặc tài liệu chính thống.
    2. KHÔNG ĐƯỢC bịa số port, địa chỉ IP, số liệu băng thông, hoặc thông số kỹ thuật.
       - Ví dụ: DHCP dùng port 67/68, HTTP dùng port 80, HTTPS dùng port 443.
    3. Với câu hỏi tính toán (subnet, bandwidth, delay):
       - PHẢI kiểm tra lại phép tính trước khi đưa vào đáp án.
       - Trong "explanation" PHẢI trình bày cách tính để xác minh kết quả.
    4. KHÔNG được nhầm lẫn giữa các giao thức (TCP vs UDP, IPv4 vs IPv6).
    5. Các lớp mạng (Layer) phải chính xác theo mô hình OSI hoặc TCP/IP.

    YÊU CẦU VỀ CẤU TRÚC ĐÁP ÁN:
    6. "correctAnswer" là chỉ số (index) của đáp án đúng, bắt đầu từ 0.
    7. Các đáp án phải:
       - Có độ dài tương đương nhau (tránh câu dài nhất là đáp án đúng).
       - Không quá chung chung hoặc quá đặc thù.
       - Nội dung cùng kiểu (không trộn số liệu, định nghĩa, mô tả).
    8. Đáp án đúng phải ở vị trí NGẪU NHIÊN (không luôn là A hoặc C).
    9. KHÔNG dùng từ khóa như "tất cả", "đúng nhất", "chính xác nhất", "câu trên đều sai".
    
    YÊU CẦU KHÁC:
    10. "explanation" ngắn gọn, khách quan, giải thích tại sao đáp án đúng là đúng.
    11. TRẢ VỀ ĐÚNG "difficulty" cho mỗi câu ("easy", "medium", "hard").
    12. Chỉ trả về JSON THUẦN, không bọc trong ``` và không thêm text khác.
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
        
        default_difficulty = params.difficulty if params.difficulty else "medium"

        for index, q in enumerate(parsed):
            questions.append(
                Question(
                    id=f"q-{now_ms}-{index}",
                    content=q["content"],
                    options=q["options"],
                    correctAnswer=q["correctAnswer"],
                    chapter=chapter,
                    topic=topic,
                    knowledgeType=knowledge_type,
                    difficulty=q.get("difficulty", default_difficulty),
                    explanation=q.get("explanation"),
                )
            )

        return questions
    except Exception as exc:
        print("Error parsing questions from LLM:", exc)
        raise

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Database = Depends(get_db)
) -> dict:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Chưa xác thực")
    
    try:
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Không tìm thấy người dùng")
        
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

def get_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Dependency to check if user is admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối: Yêu cầu quyền quản trị viên")
    return current_user

@app.get("/")
def root():
    return {"status": "running"}

@app.post("/api/auth/login", response_model=AuthResponse, tags=["Xác thực"])
def login(request: LoginRequest, db: Database = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    if user.get("isLocked", False):
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")
    
    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"], 
            dob=user.get("dob"),
            phone=user.get("phone"),
            isLocked=user.get("isLocked", False)
        )
    )

@app.get("/api/auth/me", response_model=UserResponse, tags=["Xác thực"])
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        dob=current_user.get("dob"),
        phone=current_user.get("phone"),
        isLocked=current_user.get("isLocked", False)
    )

@app.post("/api/auth/send-otp", tags=["Xác thực"])
def send_otp(request: SendOTPRequest, db: Database = Depends(get_db)):
    """Send OTP to email for registration verification"""
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    
    # Kiểm tra địa chỉ mail
    is_valid, error_msg = validate_email_address(request.email)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    otp = generate_otp()
    
    email_sent = send_otp_email(request.email, request.name, otp)
    if not email_sent:
        raise HTTPException(
            status_code=400, 
            detail="Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email."
        )
    
    expires_at = datetime.now() + timedelta(minutes=5)
    create_otp(db, request.email, otp, expires_at)
    
    return {"message": "Mã xác nhận đã được gửi đến email của bạn"}

@app.post("/api/auth/register", response_model=AuthResponse, tags=["Xác thực"])
def register(request: RegisterRequest, db: Database = Depends(get_db)):
    """Register a new user with OTP verification"""
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    
    if not verify_otp(db, request.email, request.otp):
        raise HTTPException(status_code=400, detail="Mã OTP không đúng hoặc đã hết hạn")
    
    user = create_user(db, request.email, request.password, request.name)
    delete_otp(db, request.email)
    access_token = create_access_token(data={"sub": user["id"]})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            dob=user.get("dob"),
            phone=user.get("phone"),
            isLocked=user.get("isLocked", False)
        )
    )

@app.post("/api/auth/forgot-password", tags=["Xác thực"])
def forgot_password(request: ForgotPasswordRequest, db: Database = Depends(get_db)):
    """Send OTP to email for password reset"""
    user = get_user_by_email(db, request.email)
    if not user:
        return {"message": "Mã xác nhận sẽ được gửi nếu email tồn tại trong hệ thống"}
    
    otp = generate_otp()
    
    email_sent = send_reset_password_otp_email(request.email, user["name"], otp)
    if not email_sent:
        raise HTTPException(
            status_code=500, 
            detail="Không thể gửi email xác nhận. Vui lòng thử lại sau."
        )
    
    expires_at = datetime.now() + timedelta(minutes=5)
    create_otp(db, request.email, otp, expires_at)
    
    return {"message": "Mã xác nhận đã được gửi đến email của bạn"}

@app.post("/api/auth/reset-password", tags=["Xác thực"])
def reset_password(request: ResetPasswordRequest, db: Database = Depends(get_db)):
    """Reset user password with OTP verification"""
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=400, detail="Email không tồn tại")
    
    if not verify_otp(db, request.email, request.otp):
        raise HTTPException(status_code=400, detail="Mã OTP không đúng hoặc đã hết hạn")
    
    success = update_user_password(db, user["id"], request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Không thể cập nhật mật khẩu")
    
    delete_otp(db, request.email)
    
    return {"message": "Mật khẩu đã được đặt lại thành công"}

@app.put("/api/auth/profile", response_model=UserResponse, tags=["Xác thực"])
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
        raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin cá nhân")
    
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],
        dob=updated_user.get("dob"),
        phone=updated_user.get("phone"),
        isLocked=updated_user.get("isLocked", False)
    )

@app.put("/api/auth/change-password", tags=["Xác thực"])
def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Change user password"""
    if not verify_password(request.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Mật khẩu hiện tại không đúng")
    
    success = update_user_password(db, current_user["id"], request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Không thể cập nhật mật khẩu")
    
    return {"message": "Đổi mật khẩu thành công"}

@app.get("/api/admin/users", response_model=List[UserResponse], tags=["Quản lý người dùng"])
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
            role=u["role"],
            dob=u.get("dob"),
            phone=u.get("phone"),
            isLocked=u.get("isLocked", False)
        )
        for u in users
    ]

@app.post("/api/admin/users", response_model=UserResponse, tags=["Quản lý người dùng"])
def create_user_admin(
    request: CreateUserRequest,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Create a new user (admin only)"""
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    
    user = create_user(db, request.email, request.password, request.name, request.role)
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        dob=user.get("dob"),
        phone=user.get("phone"),
        isLocked=user.get("isLocked", False)
    )

@app.delete("/api/admin/users/{user_id}", tags=["Quản lý người dùng"])
def delete_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Delete a user (admin only)"""
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản của chính bạn")
    
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return {"message": "Xóa người dùng thành công"}

@app.put("/api/admin/users/{user_id}/lock", tags=["Quản lý người dùng"])
def lock_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Lock a user (admin only)"""
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể khóa tài khoản của chính bạn")
    
    success = lock_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return {"message": "Khóa người dùng thành công"}

@app.put("/api/admin/users/{user_id}/unlock", tags=["Quản lý người dùng"])
def unlock_user_admin(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Unlock a user (admin only)"""
    success = unlock_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return {"message": "Mở khóa người dùng thành công"}

@app.put("/api/admin/users/{user_id}/role", tags=["Quản lý người dùng"])
def update_user_role_admin(
    user_id: str,
    request: UpdateUserRoleRequest,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Update a user's role (admin only)"""
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể thay đổi vai trò của chính bạn")
    
    updated_user = update_user(db, user_id, {"role": request.role})
    if not updated_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    role_label = "Quản trị viên" if request.role == "admin" else "Người dùng"
    return {"message": f"Đã cập nhật vai trò thành {role_label}"}

@app.put("/api/admin/users/{user_id}/reset-password", tags=["Quản lý người dùng"])
def admin_reset_user_password(
    user_id: str,
    request: AdminResetPasswordRequest,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Reset a user's password (admin only)"""
    if user_id == admin_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể đặt lại mật khẩu của chính bạn. Vui lòng dùng chức năng Đổi mật khẩu.")
    
    target_user = get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    success = update_user_password(db, user_id, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Không thể đặt lại mật khẩu")
    
    return {"message": "Đặt lại mật khẩu thành công"}

@app.get("/api/settings/gemini", response_model=GeminiSettingsResponse, tags=["Cài đặt"])
def get_gemini_settings(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get user's Gemini AI settings"""
    settings = get_user_settings(db, current_user["id"])
    if not settings:
        return GeminiSettingsResponse(model=None, apiKey=None)
    
    api_key = settings.get("geminiApiKey")
    masked_key = None
    if api_key:
        masked_key = "•" * (len(api_key) - 4) + api_key[-4:] if len(api_key) > 4 else "•" * len(api_key)
    
    return GeminiSettingsResponse(
        model=settings.get("geminiModel"),
        apiKey=masked_key
    )

@app.put("/api/settings/gemini", tags=["Cài đặt"])
def update_gemini_settings(
    request: GeminiSettingsRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Update user's Gemini AI settings"""
    settings_data = {}
    unset_fields = []
    
    if request.model is not None:
        settings_data["geminiModel"] = request.model
    
    if request.apiKey is not None:
        if not request.apiKey.startswith("•"):
            if request.apiKey:
                settings_data["geminiApiKey"] = request.apiKey
            else:
                unset_fields.append("geminiApiKey")
    
    if settings_data:
        save_user_settings(db, current_user["id"], settings_data)
    
    if unset_fields:
        db.user_settings.update_one(
            {"userId": current_user["id"]},
            {"$unset": {field: "" for field in unset_fields}}
        )
    
    return {"message": "Đã lưu cài đặt thành công"}

@app.get("/api/admin/settings", response_model=SystemSettingsResponse, tags=["Cài đặt"])
def get_admin_settings(
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Get system settings (admin only)"""
    settings = get_system_settings(db)
    return SystemSettingsResponse(
        defaultKeyLocked=settings.get("defaultKeyLocked", False)
    )

@app.put("/api/admin/settings/lock-default-key", tags=["Cài đặt"])
def toggle_default_key_lock(
    request: LockDefaultKeyRequest,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Lock or unlock default API key (admin only)"""
    save_system_settings(db, {"defaultKeyLocked": request.locked})
    status = "đã khóa" if request.locked else "đã mở khóa"
    return {"message": f"API key mặc định {status}"}

@app.get("/api/settings/default-key-status", tags=["Cài đặt"])
def get_default_key_status(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get default API key lock status"""
    system_settings = get_system_settings(db)
    is_locked = system_settings.get("defaultKeyLocked", False)
    
    user_settings = get_user_settings(db, current_user["id"])
    has_personal_key = bool(user_settings and user_settings.get("geminiApiKey"))
    
    return {
        "defaultKeyLocked": is_locked,
        "hasPersonalKey": has_personal_key,
        "canUseAI": has_personal_key or not is_locked
    }

def get_gemini_client_for_user(db: Database, user_id: str) -> tuple:
    """Get Gemini client and model name for a user based on their settings
    Returns: (client, model_name) or raises HTTPException if default key is locked
    """
    settings = get_user_settings(db, user_id)
    
    user_api_key = settings.get("geminiApiKey") if settings else None
    user_model = settings.get("geminiModel") if settings else None
    
    if user_api_key:
        user_client = genai.Client(api_key=user_api_key)
        active_model = user_model if user_model else MODEL_NAME
        return user_client, active_model
    
    system_settings = get_system_settings(db)
    if system_settings.get("defaultKeyLocked", False):
        raise HTTPException(
            status_code=403, 
            detail="DEFAULT_KEY_LOCKED:Quản trị viên đã khóa API key mặc định. Vui lòng thiết lập API key cá nhân trong phần Cài đặt."
        )
    
    if not API_KEY:
        return None, None
    
    active_model = user_model if user_model else MODEL_NAME
    return client, active_model

def handle_gemini_error(exc: Exception):
    print("Error calling Gemini API:", exc)
    
    status_code = getattr(exc, "status_code", None)
    if not status_code and hasattr(exc, "code"):
        status_code = exc.code
        
    error_msg = str(exc)
    
    if status_code == 429 or "429" in error_msg:
        raise HTTPException(
            status_code=429, 
            detail="[Lỗi 429] Quá số lần gọi API. Vui lòng đợi 1-2 phút rồi thử lại."
        )
        
    if status_code == 503 or "503" in error_msg:
        raise HTTPException(
            status_code=503, 
            detail="[Lỗi 503] Server Gemini quá tải. Vui lòng thử lại sau."
        )
    
    if status_code == 400 or "400" in error_msg:
        raise HTTPException(
            status_code=400, 
            detail="[Lỗi 400] Yêu cầu không hợp lệ - kiểm tra lại API Key hoặc model."
        )
    
    if status_code == 403 or "403" in error_msg:
        raise HTTPException(
            status_code=403, 
            detail="[Lỗi 403] API Key không hợp lệ hoặc đã hết hạn."
        )
    
    if status_code == 404 or "404" in error_msg:
        raise HTTPException(
            status_code=404, 
            detail="[Lỗi 404] Model không tồn tại. Vui lòng chọn model khác trong Cài đặt."
        )
        
    raise HTTPException(status_code=500, detail=f"[Lỗi 500] Lỗi khi gọi Gemini API: {error_msg[:100]}")

@app.post("/api/generate-questions", response_model=GenerateQuestionsResponse, tags=["Tính năng AI"])
def generate_questions(
    request: GenerateQuestionsRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
) -> GenerateQuestionsResponse:
    user_client, user_model = get_gemini_client_for_user(db, current_user["id"])
    
    if user_client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY chưa được cấu hình. Vui lòng cấu hình API Key trong Cài đặt hoặc liên hệ quản trị viên.",
        )

    prompt = build_prompt(request)

    try:
        gemini_response = user_client.models.generate_content(
            model=user_model,
            contents=prompt,
            config=GENERATION_CONFIG_QUESTIONS,
        )

        generated_text = gemini_response.text
        questions = parse_generated_questions(generated_text, request)
        return GenerateQuestionsResponse(questions=questions)
    except HTTPException:
        raise
    except Exception as exc:
        handle_gemini_error(exc)

@app.post("/api/analyze-result", response_model=AnalyzeResultResponse, tags=["Tính năng AI"])
def analyze_result(
    request: AnalyzeResultRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
) -> AnalyzeResultResponse:
    user_client, user_model = get_gemini_client_for_user(db, current_user["id"])
    
    if user_client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY chưa được cấu hình. Vui lòng cấu hình API Key trong Cài đặt hoặc liên hệ quản trị viên.",
        )

    prompt = build_analysis_prompt(request)

    try:
        gemini_response = user_client.models.generate_content(
            model=user_model,
            contents=prompt,
            config=GENERATION_CONFIG_ANALYSIS,
        )

        generated_text = gemini_response.text or ""

        try:
            data = json.loads(generated_text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", generated_text)
            if not match:
                raise ValueError("No JSON object found in LLM response")
            data = json.loads(match.group(0))

        result = AnalyzeResultResponse(
            overallFeedback=data.get(
                "overallFeedback", "Không thể phân tích kết quả bài làm."
            ),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestedTopics=data.get("suggestedTopics", []),
            suggestedNextActions=data.get("suggestedNextActions", []),
        )
        
        history_data = {
            "id": f"analysis-{int(time.time() * 1000)}",
            "userId": current_user["id"],
            "analysisType": "result",
            "title": request.quizTitle,
            "result": result.model_dump(),
            "context": {"score": request.score, "timeSpent": request.timeSpent},
            "createdAt": datetime.now().isoformat()
        }
        create_analysis_history(db, history_data)
        
        return result
    except HTTPException:
        raise
    except Exception as exc:
        handle_gemini_error(exc)

@app.post("/api/analyze-overall", response_model=AnalyzeResultResponse, tags=["Tính năng AI"])
def analyze_overall(
    request: AnalyzeOverallRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
) -> AnalyzeResultResponse:
    user_client, user_model = get_gemini_client_for_user(db, current_user["id"])
    
    if user_client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY chưa được cấu hình. Vui lòng cấu hình API Key trong Cài đặt hoặc liên hệ quản trị viên.",
        )

    prompt = build_overall_analysis_prompt(request)

    try:
        gemini_response = user_client.models.generate_content(
            model=user_model,
            contents=prompt,
            config=GENERATION_CONFIG_ANALYSIS,
        )

        generated_text = gemini_response.text or ""

        try:
            data = json.loads(generated_text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", generated_text)
            if not match:
                raise ValueError("No JSON object found in LLM response")
            data = json.loads(match.group(0))

        result = AnalyzeResultResponse(
            overallFeedback=data.get(
                "overallFeedback", "Không thể phân tích tổng quan lịch sử làm bài."
            ),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestedTopics=data.get("suggestedTopics", []),
            suggestedNextActions=data.get("suggestedNextActions", []),
        )
        
        history_data = {
            "id": f"analysis-{int(time.time() * 1000)}",
            "userId": current_user["id"],
            "analysisType": "overall",
            "title": "Phân tích tổng quan",
            "result": result.model_dump(),
            "context": {"attemptCount": request.attemptCount, "avgScore": request.avgScore},
            "createdAt": datetime.now().isoformat()
        }
        create_analysis_history(db, history_data)
        
        return result
    except HTTPException:
        raise
    except Exception as exc:
        handle_gemini_error(exc)

def build_progress_analysis_prompt(request) -> str:
    progress_text = "\n".join([
        f"- {p.date}: {p.score:.1f} điểm ({p.quizTitle})" 
        for p in request.progressData
    ])
    
    trend_vi = {
        "improving": "đang tiến bộ",
        "declining": "đang giảm sút", 
        "stable": "ổn định"
    }.get(request.trend, request.trend)
    
    prompt = f"""Bạn là một chuyên gia giáo dục. Hãy phân tích sự tiến triển học tập của sinh viên dựa trên dữ liệu sau:

Sinh viên: {request.studentName or 'Không xác định'}
Chương/Chủ đề: {request.chapter}
Xu hướng hiện tại: {trend_vi}
Điểm trung bình: {request.avgScore:.1f}

Lịch sử làm bài (theo thời gian):
{progress_text}

Hãy phân tích:
1. Đánh giá tổng quan về sự tiến triển
2. Điểm mạnh trong quá trình học
3. Điểm cần cải thiện
4. Đề xuất các bước tiếp theo

Trả về JSON với format:
{{
    "overallFeedback": "Nhận xét tổng quan về tiến triển...",
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "suggestedTopics": ["Chủ đề nên ôn lại 1", "Chủ đề nên ôn lại 2"],
    "suggestedNextActions": ["Hành động 1", "Hành động 2"]
}}

CHỈ trả về JSON, không có text khác."""
    return prompt

@app.post("/api/analyze-progress", response_model=AnalyzeResultResponse, tags=["Tính năng AI"])
def analyze_progress(
    request: AnalyzeProgressRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
) -> AnalyzeResultResponse:
    user_client, user_model = get_gemini_client_for_user(db, current_user["id"])
    
    if user_client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY chưa được cấu hình. Vui lòng cấu hình API Key trong Cài đặt hoặc liên hệ quản trị viên.",
        )

    prompt = build_progress_analysis_prompt(request)

    try:
        gemini_response = user_client.models.generate_content(
            model=user_model,
            contents=prompt,
            config=GENERATION_CONFIG_ANALYSIS,
        )

        generated_text = gemini_response.text or ""

        try:
            data = json.loads(generated_text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", generated_text)
            if not match:
                raise ValueError("No JSON object found in LLM response")
            data = json.loads(match.group(0))

        result = AnalyzeResultResponse(
            overallFeedback=data.get(
                "overallFeedback", "Không thể phân tích tiến triển học tập."
            ),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestedTopics=data.get("suggestedTopics", []),
            suggestedNextActions=data.get("suggestedNextActions", []),
        )
        
        # Save to analysis history
        history_data = {
            "id": f"analysis-{int(time.time() * 1000)}",
            "userId": current_user["id"],
            "analysisType": "progress",
            "title": f"Tiến triển: {request.chapter}",
            "result": result.model_dump(),
            "context": {"chapter": request.chapter, "trend": request.trend, "avgScore": request.avgScore},
            "createdAt": datetime.now().isoformat()
        }
        create_analysis_history(db, history_data)
        
        return result
    except HTTPException:
        raise
    except Exception as exc:
        handle_gemini_error(exc)

@app.get("/api/analysis-history", response_model=PaginatedResponse[AnalysisHistoryResponse], tags=["Lịch sử phân tích"])
def get_analysis_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get analysis history for the current user with pagination"""
    skip = (page - 1) * size
    result = get_analysis_history_by_user(db, current_user["id"], skip=skip, limit=size)
    
    items = result["items"]
    total = result["total"]
    pages = (total + size - 1) // size if total > 0 else 1
    
    return PaginatedResponse(
        items=[
            AnalysisHistoryResponse(
                id=item["id"],
                userId=item["userId"],
                analysisType=item["analysisType"],
                title=item["title"],
                result=AnalysisResultData(**item["result"]),
                context=item.get("context"),
                createdAt=item["createdAt"]
            )
            for item in items
        ],
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@app.delete("/api/analysis-history/{analysis_id}", tags=["Lịch sử phân tích"])
def delete_analysis_history_endpoint(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete an analysis history record"""
    success = delete_analysis_history(db, analysis_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi phân tích hoặc bạn không có quyền xóa")
    return {"message": "Xóa bản ghi phân tích thành công"}

# Quiz endpoints
@app.get("/api/quizzes", response_model=PaginatedResponse[QuizResponse], tags=["Quản lý đề thi"])
def get_quizzes(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    created_by: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all quizzes with pagination, optionally filtered by creator"""
    skip = (page - 1) * size
    result = get_all_quizzes(db, current_user["id"], skip=skip, limit=size)
    
    quizzes = result["items"]
    total = result["total"]
    pages = (total + size - 1) // size
    
    return PaginatedResponse(
        items=[
            QuizResponse(
                id=q["id"],
                title=q["title"],
                description=q.get("description", ""),
                questions=q["questions"],
                duration=q["duration"],
                createdBy=q["createdBy"],
                createdAt=q.get("createdAt", datetime.now().isoformat()),
                settings=QuizSettings(**q.get("settings", {"questionCount": len(q.get("questions", []))}))
            )
            for q in quizzes
        ],
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@app.get("/api/quizzes/{quiz_id}", response_model=QuizResponse, tags=["Quản lý đề thi"])
def get_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get a specific quiz by ID"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đề thi này")
    
    return QuizResponse(
        id=quiz["id"],
        title=quiz["title"],
        description=quiz.get("description", ""),
        questions=quiz["questions"],
        duration=quiz["duration"],
        createdBy=quiz["createdBy"],
        createdAt=quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**quiz.get("settings", {"questionCount": len(quiz.get("questions", []))}))
    )

@app.post("/api/quizzes", response_model=QuizResponse, tags=["Quản lý đề thi"])
def create_quiz_endpoint(
    request: CreateQuizRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Create a new quiz"""
    quiz_id = f"quiz-{int(time.time() * 1000)}"
    quiz_data = {
        "id": quiz_id,
        "title": request.title,
        "description": request.description,
        "questions": [q.model_dump() for q in request.questions],
        "duration": request.duration,
        "createdBy": current_user["id"],
        "createdAt": datetime.now().isoformat(),
        "settings": request.settings.model_dump()
    }
    
    created_quiz = create_quiz(db, quiz_data)
    
    return QuizResponse(
        id=created_quiz["id"],
        title=created_quiz["title"],
        description=created_quiz.get("description", ""),
        questions=created_quiz["questions"],
        duration=created_quiz["duration"],
        createdBy=created_quiz["createdBy"],
        createdAt=created_quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**created_quiz.get("settings", {"questionCount": len(created_quiz.get("questions", []))}))
    )

@app.put("/api/quizzes/{quiz_id}", response_model=QuizResponse, tags=["Quản lý đề thi"])
def update_quiz_endpoint(
    quiz_id: str,
    request: UpdateQuizRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Update a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật đề thi này")
    
    updates = {}
    if request.title is not None:
        updates["title"] = request.title
    if request.description is not None:
        updates["description"] = request.description
    if request.duration is not None:
        updates["duration"] = request.duration
    if request.questions is not None:
        updates["questions"] = [q.model_dump() if hasattr(q, 'model_dump') else q for q in request.questions]
        settings = quiz.get("settings", {})
        settings["questionCount"] = len(request.questions)
        updates["settings"] = settings
    
    updated_quiz = update_quiz(db, quiz_id, updates)
    if not updated_quiz:
        raise HTTPException(status_code=400, detail="Không thể cập nhật đề thi")
    
    return QuizResponse(
        id=updated_quiz["id"],
        title=updated_quiz["title"],
        description=updated_quiz.get("description", ""),
        questions=updated_quiz["questions"],
        duration=updated_quiz["duration"],
        createdBy=updated_quiz["createdBy"],
        createdAt=updated_quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**updated_quiz.get("settings", {"questionCount": len(updated_quiz.get("questions", []))}))
    )

@app.delete("/api/quizzes/{quiz_id}", tags=["Quản lý đề thi"])
def delete_quiz_endpoint(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa đề thi này")
    
    success = delete_quiz(db, quiz_id)
    if not success:
        raise HTTPException(status_code=400, detail="Không thể xóa đề thi")
    
    return {"message": "Xóa đề thi thành công"}

@app.put("/api/quizzes/{quiz_id}/questions/{question_id}", response_model=QuizResponse, tags=["Quản lý câu hỏi"])
def update_question_endpoint(
    quiz_id: str,
    question_id: str,
    request: UpdateQuestionRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Update a question in a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật đề thi này")
    
    updates = {}
    if request.content is not None:
        updates["content"] = request.content
    if request.options is not None:
        updates["options"] = request.options
    if request.correctAnswer is not None:
        updates["correctAnswer"] = request.correctAnswer
    if request.chapter is not None:
        updates["chapter"] = request.chapter
    if request.topic is not None:
        updates["topic"] = request.topic
    if request.knowledgeType is not None:
        updates["knowledgeType"] = request.knowledgeType
    if request.difficulty is not None:
        updates["difficulty"] = request.difficulty
    if request.explanation is not None:
        updates["explanation"] = request.explanation
    
    updated_quiz = update_question_in_quiz(db, quiz_id, question_id, updates)
    if not updated_quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    
    return QuizResponse(
        id=updated_quiz["id"],
        title=updated_quiz["title"],
        description=updated_quiz.get("description", ""),
        questions=updated_quiz["questions"],
        duration=updated_quiz["duration"],
        createdBy=updated_quiz["createdBy"],
        createdAt=updated_quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**updated_quiz.get("settings", {"questionCount": len(updated_quiz.get("questions", []))}))
    )

@app.delete("/api/quizzes/{quiz_id}/questions/{question_id}", response_model=QuizResponse, tags=["Quản lý câu hỏi"])
def delete_question_endpoint(
    quiz_id: str,
    question_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete a question from a quiz"""
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật đề thi này")
    
    updated_quiz = delete_question_from_quiz(db, quiz_id, question_id)
    if not updated_quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    
    return QuizResponse(
        id=updated_quiz["id"],
        title=updated_quiz["title"],
        description=updated_quiz.get("description", ""),
        questions=updated_quiz["questions"],
        duration=updated_quiz["duration"],
        createdBy=updated_quiz["createdBy"],
        createdAt=updated_quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**updated_quiz.get("settings", {"questionCount": len(updated_quiz.get("questions", []))}))
    )

@app.post("/api/attempts", response_model=AttemptResponse, tags=["Làm bài thi"])
def create_attempt_endpoint(
    request: CreateAttemptRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Create a new quiz attempt"""
    quiz = get_quiz_by_id(db, request.quizId)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
        
    if quiz["createdBy"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền tham gia thi đề này")
    
    attempt_id = f"attempt-{int(time.time() * 1000)}"
    attempt_data = {
        "id": attempt_id,
        "quizId": request.quizId,
        "studentId": current_user["id"],
        "answers": request.answers,
        "score": request.score,
        "timeSpent": request.timeSpent,
        "completedAt": datetime.now().isoformat()
    }
    
    created_attempt = create_attempt(db, attempt_data)
    
    return AttemptResponse(
        id=created_attempt["id"],
        quizId=created_attempt["quizId"],
        studentId=created_attempt["studentId"],
        answers=created_attempt["answers"],
        score=created_attempt["score"],
        completedAt=created_attempt["completedAt"],
        timeSpent=created_attempt["timeSpent"]
    )

@app.get("/api/attempts", response_model=List[AttemptResponse], tags=["Làm bài thi"])
def get_attempts_endpoint(
    quiz_id: Optional[str] = Query(None, alias="quiz_id"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all attempts, optionally filtered by quiz_id"""
    if quiz_id:
        quiz = get_quiz_by_id(db, quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
        if quiz["createdBy"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem kết quả của đề thi này")
            
        attempts = get_attempts_by_quiz(db, quiz_id)
    else:
        attempts = get_attempts_by_student(db, current_user["id"])
    
    return [
        AttemptResponse(
            id=a["id"],
            quizId=a["quizId"],
            studentId=a["studentId"],
            answers=a["answers"],
            score=a["score"],
            completedAt=a["completedAt"],
            timeSpent=a["timeSpent"]
        )
        for a in attempts
    ]

@app.get("/api/attempts/{attempt_id}", response_model=AttemptResponse, tags=["Làm bài thi"])
def get_attempt_endpoint(
    attempt_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get a specific attempt by ID"""
    attempt = get_attempt_by_id(db, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    if attempt["studentId"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem bài làm này")
    
    return AttemptResponse(
        id=attempt["id"],
        quizId=attempt["quizId"],
        studentId=attempt["studentId"],
        answers=attempt["answers"],
        score=attempt["score"],
        completedAt=attempt["completedAt"],
        timeSpent=attempt["timeSpent"]
    )

# ===== Community Chat WebSocket =====
class ConnectionManager:
    """Manages WebSocket connections for community chat"""
    def __init__(self):
        self.active_connections: dict[str, dict] = {}
        self.private_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user: dict):
        await websocket.accept()
        user_id = user["id"]
        self.active_connections[user_id] = {
            "websocket": websocket,
            "user": {"id": user["id"], "name": user["name"]}
        }
        await self.broadcast_online_users()
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            user_name = self.active_connections[user_id]["user"]["name"]
            del self.active_connections[user_id]
            return user_name
        return None
    
    async def broadcast_message(self, message: dict):
        """Broadcast message to all connected users"""
        disconnected = []
        for user_id, conn_data in list(self.active_connections.items()):
            try:
                await conn_data["websocket"].send_json(message)
            except:
                disconnected.append(user_id)
        for user_id in disconnected:
            self.disconnect(user_id)
    
    async def broadcast_system_message(self, content: str):
        """Broadcast a system message"""
        message = {
            "type": "system",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_message(message)
    
    async def broadcast_online_users(self):
        """Broadcast the current list of online users"""
        online_users = [
            conn_data["user"] for conn_data in self.active_connections.values()
        ]
        message = {
            "type": "online_users",
            "users": online_users
        }
        await self.broadcast_message(message)
    
    def get_online_users(self) -> list[dict]:
        """Get list of online users"""
        return [conn_data["user"] for conn_data in self.active_connections.values()]
    
    async def send_private_message(self, from_user: dict, to_user_id: str, content: str) -> bool:
        """Send a private message to a specific user"""
        if to_user_id not in self.active_connections:
            return False
        
        message = {
            "type": "private_message",
            "from": {"id": from_user["id"], "name": from_user["name"]},
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            await self.active_connections[to_user_id]["websocket"].send_json(message)
            return True
        except:
            return False

manager = ConnectionManager()

def get_db_sync():
    """Get database instance synchronously"""
    from database import get_database
    return get_database()

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(None)):
    """WebSocket endpoint for community chat"""
    if not token:
        await websocket.close(code=4001, reason="Token không hợp lệ")
        return
    
    try:
        payload = verify_token(token)
        if not payload:
            await websocket.close(code=4001, reason="Token không hợp lệ")
            return
        
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Token không hợp lệ")
            return
        
        db = get_db_sync()
        user = get_user_by_id(db, user_id)
        if not user:
            await websocket.close(code=4001, reason="Không tìm thấy người dùng")
            return
    except Exception as e:
        await websocket.close(code=4001, reason="Token không hợp lệ")
        return
    
    await manager.connect(websocket, user)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")
            
            if msg_type == "message":
                content = data.get("content", "").strip()
                if content:
                    db = get_db_sync()
                    message_data = {
                        "id": f"msg-{int(time.time() * 1000)}",
                        "userId": user["id"],
                        "userName": user["name"],
                        "content": content,
                        "timestamp": datetime.now().isoformat()
                    }
                    db.chat_messages.insert_one(message_data)
                    
                    broadcast_msg = {
                        "type": "message",
                        "id": message_data["id"],
                        "userId": user["id"],
                        "userName": user["name"],
                        "content": content,
                        "timestamp": message_data["timestamp"]
                    }
                    await manager.broadcast_message(broadcast_msg)
            
            elif msg_type == "private":
                to_user_id = data.get("to")
                content = data.get("content", "").strip()
                if to_user_id and content:
                    db = get_db_sync()
                    private_msg_data = {
                        "id": f"pmsg-{int(time.time() * 1000)}",
                        "fromUserId": user["id"],
                        "fromUserName": user["name"],
                        "toUserId": to_user_id,
                        "content": content,
                        "timestamp": datetime.now().isoformat()
                    }
                    db.private_messages.insert_one(private_msg_data)
                    
                    await manager.send_private_message(user, to_user_id, content)
                    
                    sender_msg = {
                        "type": "private_sent",
                        "to": to_user_id,
                        "content": content,
                        "timestamp": private_msg_data["timestamp"]
                    }
                    await websocket.send_json(sender_msg)
    
    except WebSocketDisconnect:
        manager.disconnect(user["id"])
        await manager.broadcast_online_users()

@app.get("/api/chat/messages", tags=["Chat cộng đồng"])
def get_chat_messages(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get recent public chat messages"""
    messages = list(
        db.chat_messages.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    messages.reverse()
    return {"messages": messages}

@app.get("/api/chat/private/{user_id}", tags=["Chat cộng đồng"])
def get_private_messages(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get private message history with a specific user"""
    messages = list(
        db.private_messages.find(
            {
                "$or": [
                    {"fromUserId": current_user["id"], "toUserId": user_id},
                    {"fromUserId": user_id, "toUserId": current_user["id"]}
                ]
            },
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
    )
    messages.reverse()
    return {"messages": messages}

@app.get("/api/chat/online", tags=["Chat cộng đồng"])
def get_online_users_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """Get list of currently online users"""
    return {"users": manager.get_online_users()}

@app.delete("/api/chat/private/{user_id}", tags=["Chat cộng đồng"])
def delete_private_chat(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete all private messages with a specific user"""
    result = db.private_messages.delete_many({
        "$or": [
            {"fromUserId": current_user["id"], "toUserId": user_id},
            {"fromUserId": user_id, "toUserId": current_user["id"]}
        ]
    })
    return {"message": f"Đã xóa {result.deleted_count} tin nhắn riêng"}

@app.delete("/api/chat/messages/{message_id}", tags=["Chat cộng đồng"])
def delete_chat_message(
    message_id: str,
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Delete a public chat message (admin only)"""
    result = db.chat_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin nhắn")
    return {"message": "Đã xóa tin nhắn"}

@app.delete("/api/chat/messages", tags=["Chat cộng đồng"])
def delete_all_chat_messages(
    admin_user: dict = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """Delete all public chat messages (admin only)"""
    result = db.chat_messages.delete_many({})
    return {"message": f"Đã xóa {result.deleted_count} tin nhắn cộng đồng"}

# ===== Quiz Discussion Endpoints =====
@app.post("/api/discussions", response_model=QuizDiscussionResponse, tags=["Thảo luận đề thi"])
def add_to_discussion_endpoint(
    request: AddToDiscussionRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Add a quiz to discussions"""
    quiz = get_quiz_by_id(db, request.quizId)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    existing = get_quiz_discussion_by_quiz_id(db, request.quizId)
    if existing:
        raise HTTPException(status_code=400, detail="Đề thi này đã được thêm vào thảo luận")
    
    discussion_data = {
        "id": f"disc-{int(time.time() * 1000)}",
        "quizId": request.quizId,
        "addedBy": current_user["id"],
        "addedAt": datetime.now().isoformat()
    }
    add_quiz_to_discussion(db, discussion_data)
    
    return QuizDiscussionResponse(
        id=discussion_data["id"],
        quizId=discussion_data["quizId"],
        quizTitle=quiz["title"],
        quizDescription=quiz.get("description"),
        addedBy=current_user["id"],
        addedByName=current_user["name"],
        addedAt=discussion_data["addedAt"],
        messageCount=0
    )

@app.get("/api/discussions", tags=["Thảo luận đề thi"])
def get_discussions_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all quizzes in discussions with pagination"""
    from database import count_quiz_discussions
    
    skip = (page - 1) * size
    discussions = get_quiz_discussions(db, skip=skip, limit=size)
    total = count_quiz_discussions(db)
    
    result = []
    for disc in discussions:
        quiz = get_quiz_by_id(db, disc["quizId"])
        if quiz:
            added_by_user = get_user_by_id(db, disc["addedBy"])
            added_by_name = added_by_user["name"] if added_by_user else "Unknown"
            
            message_count = db.discussion_messages.count_documents({"quizId": disc["quizId"]})
            
            result.append(QuizDiscussionResponse(
                id=disc["id"],
                quizId=disc["quizId"],
                quizTitle=quiz["title"],
                quizDescription=quiz.get("description"),
                addedBy=disc["addedBy"],
                addedByName=added_by_name,
                addedAt=disc["addedAt"],
                messageCount=message_count
            ))
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@app.delete("/api/discussions/{quiz_id}", tags=["Thảo luận đề thi"])
def remove_from_discussion_endpoint(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Remove a quiz from discussions (only by owner or admin)"""
    discussion = get_quiz_discussion_by_quiz_id(db, quiz_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Không tìm thấy thảo luận")
    
    if discussion["addedBy"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa thảo luận này")
    
    delete_discussion_messages_by_quiz(db, quiz_id)
    remove_quiz_from_discussion(db, quiz_id)
    
    return {"message": "Đã xóa đề thi khỏi thảo luận"}

@app.get("/api/discussions/{quiz_id}/quiz", response_model=QuizResponse, tags=["Thảo luận đề thi"])
def get_discussion_quiz_endpoint(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get quiz data for discussion participants (no owner check)"""
    discussion = get_quiz_discussion_by_quiz_id(db, quiz_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Đề thi này chưa được thêm vào thảo luận")
    
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    return QuizResponse(
        id=quiz["id"],
        title=quiz["title"],
        description=quiz.get("description", ""),
        questions=quiz["questions"],
        duration=quiz["duration"],
        createdBy=quiz["createdBy"],
        createdAt=quiz.get("createdAt", datetime.now().isoformat()),
        settings=QuizSettings(**quiz.get("settings", {"questionCount": len(quiz.get("questions", []))}))
    )

@app.get("/api/discussions/{quiz_id}/messages", response_model=List[DiscussionMessageResponse], tags=["Thảo luận đề thi"])
def get_discussion_messages_endpoint(
    quiz_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get discussion messages for a quiz"""
    discussion = get_quiz_discussion_by_quiz_id(db, quiz_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Không tìm thấy thảo luận")
    
    messages = get_discussion_messages(db, quiz_id, limit=limit)
    
    return [
        DiscussionMessageResponse(
            id=msg["id"],
            quizId=msg["quizId"],
            userId=msg["userId"],
            userName=msg["userName"],
            content=msg["content"],
            timestamp=msg["timestamp"]
        )
        for msg in messages
    ]

# ===== Quiz Discussion WebSocket =====
class DiscussionConnectionManager:
    """Manages WebSocket connections for quiz discussion chat"""
    
    def __init__(self):
        self.room_connections: dict[str, dict[str, dict]] = {}
    
    async def connect(self, websocket: WebSocket, quiz_id: str, user: dict):
        await websocket.accept()
        if quiz_id not in self.room_connections:
            self.room_connections[quiz_id] = {}
        
        if user["id"] in self.room_connections[quiz_id]:
            try:
                old_ws = self.room_connections[quiz_id][user["id"]]["ws"]
                await old_ws.close()
            except:
                pass
        
        self.room_connections[quiz_id][user["id"]] = {
            "ws": websocket,
            "user": user
        }
        await self.broadcast_online_users(quiz_id)
    
    def disconnect(self, quiz_id: str, user_id: str):
        if quiz_id in self.room_connections:
            if user_id in self.room_connections[quiz_id]:
                del self.room_connections[quiz_id][user_id]
            if not self.room_connections[quiz_id]:
                del self.room_connections[quiz_id]
    
    async def broadcast_message(self, quiz_id: str, message: dict):
        """Broadcast message to all users in a room"""
        if quiz_id not in self.room_connections:
            return
        
        disconnected = []
        for user_id, conn in self.room_connections[quiz_id].items():
            try:
                await conn["ws"].send_json(message)
            except:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            self.disconnect(quiz_id, user_id)
    
    async def broadcast_online_users(self, quiz_id: str):
        """Broadcast online users list to room"""
        if quiz_id not in self.room_connections:
            return
        
        users = [
            {"id": conn["user"]["id"], "name": conn["user"]["name"]}
            for conn in self.room_connections[quiz_id].values()
        ]
        
        await self.broadcast_message(quiz_id, {
            "type": "online_users",
            "users": users
        })
    
    def get_online_users(self, quiz_id: str) -> list:
        """Get online users for a room"""
        if quiz_id not in self.room_connections:
            return []
        return [
            {"id": conn["user"]["id"], "name": conn["user"]["name"]}
            for conn in self.room_connections[quiz_id].values()
        ]

discussion_manager = DiscussionConnectionManager()

def get_db_sync_discussion():
    """Get database instance synchronously for discussion WebSocket"""
    from database import get_database
    return get_database()

@app.websocket("/ws/discussion/{quiz_id}")
async def websocket_discussion(websocket: WebSocket, quiz_id: str, token: str = Query(None)):
    """WebSocket endpoint for quiz discussion chat"""
    if not token:
        await websocket.close(code=4001)
        return
    
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return
    
    db = get_db_sync_discussion()
    user = get_user_by_id(db, user_id)
    if not user:
        await websocket.close(code=4001)
        return
    
    discussion = get_quiz_discussion_by_quiz_id(db, quiz_id)
    if not discussion:
        await websocket.close(code=4004)
        return
    
    await discussion_manager.connect(websocket, quiz_id, user)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                content = data.get("content", "").strip()
                if content:
                    timestamp = datetime.now().isoformat()
                    
                    message_data = {
                        "id": f"dmsg-{int(time.time() * 1000)}",
                        "quizId": quiz_id,
                        "userId": user["id"],
                        "userName": user["name"],
                        "content": content,
                        "timestamp": timestamp
                    }
                    create_discussion_message(db, message_data)
                    
                    await discussion_manager.broadcast_message(quiz_id, {
                        "type": "message",
                        "id": message_data["id"],
                        "userId": user["id"],
                        "userName": user["name"],
                        "content": content,
                        "timestamp": timestamp
                    })
    
    except WebSocketDisconnect:
        discussion_manager.disconnect(quiz_id, user["id"])
        await discussion_manager.broadcast_online_users(quiz_id)
    except Exception as e:
        print(f"Discussion WebSocket error: {e}")
        discussion_manager.disconnect(quiz_id, user["id"])
        try:
            await discussion_manager.broadcast_online_users(quiz_id)
        except:
            pass

@app.get("/api/discussions/{quiz_id}/online", tags=["Thảo luận đề thi"])
def get_discussion_online_users(
    quiz_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get online users in a discussion room"""
    return {"users": discussion_manager.get_online_users(quiz_id)}