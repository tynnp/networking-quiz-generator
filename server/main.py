from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import json
import re
import time
from dotenv import load_dotenv
from google import genai
from dtos import (
    AnalyzeOverallRequest,
    AnalyzeResultRequest,
    AnalyzeResultResponse,
    GenerateQuestionsRequest,
    Question,
    GenerateQuestionsResponse,
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