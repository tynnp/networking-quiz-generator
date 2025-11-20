from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import json
import re
import time
from dotenv import load_dotenv
from google import genai
from dtos import GenerateQuestionsRequest, Question, GenerateQuestionsResponse

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
Mỗi câu hỏi phải có định dạng JSON chính xác như sau:
{{
  "content": "Nội dung câu hỏi",
  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "correctAnswer": 0,
  "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
}}

Lưu ý:
- "correctAnswer" là chỉ số (index) của phần tử đúng trong mảng "options", bắt đầu từ 0.
- Các đáp án phải tương tự nhau, đáp án đúng nằm ở vị trí ngẫu nhiên khác nhau, không dễ đoán.
- Chỉ trả về DỮ LIỆU JSON THUẦN ở dạng một mảng, không kèm giải thích hoặc mô tả bên ngoài.

Trả về một mảng JSON chứa {params.count} câu hỏi."""

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


@app.get("/")
def root():
    return {"status": "running"}


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