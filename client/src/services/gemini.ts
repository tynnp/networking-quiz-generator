import { Question } from '../types';

interface GenerateQuestionsParams {
  chapter?: string;
  topics?: string[];
  knowledgeTypes?: string[];
  difficulty?: string;
  count: number;
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini API key not found. Using mock data.');
    return generateMockQuestions(params);
  }

  try {
    const prompt = buildPrompt(params);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    return parseGeneratedQuestions(generatedText, params);
  } catch (error) {
    console.error('Error generating questions:', error);
    return generateMockQuestions(params);
  }
}

function buildPrompt(params: GenerateQuestionsParams): string {
  let prompt = `Tạo ${params.count} câu hỏi trắc nghiệm về môn Mạng máy tính.\n\n`;

  if (params.chapter) {
    prompt += `Chương: ${params.chapter}\n`;
  }

  if (params.topics && params.topics.length > 0) {
    prompt += `Chủ đề: ${params.topics.join(', ')}\n`;
  }

  if (params.knowledgeTypes && params.knowledgeTypes.length > 0) {
    const types = params.knowledgeTypes.map(t => {
      const map: { [key: string]: string } = {
        concept: 'Khái niệm',
        property: 'Tính chất',
        mechanism: 'Cơ chế hoạt động',
        rule: 'Quy tắc và tiêu chuẩn',
        scenario: 'Tình huống',
        example: 'Bài tập tính toán'
      };
      return map[t] || t;
    });
    prompt += `Loại kiến thức: ${types.join(', ')}\n`;
  }

  if (params.difficulty) {
    const diffMap: { [key: string]: string } = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó'
    };
    prompt += `Độ khó: ${diffMap[params.difficulty]}\n`;
  }

  prompt += `\nMỗi câu hỏi phải có định dạng JSON như sau:
{
  "content": "Nội dung câu hỏi",
  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "correctAnswer": 0
}

Trả về một mảng JSON chứa ${params.count} câu hỏi.`;

  return prompt;
}

function parseGeneratedQuestions(text: string, params: GenerateQuestionsParams): Question[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    const parsedQuestions = JSON.parse(jsonMatch[0]);

    return parsedQuestions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      chapter: params.chapter || 'Chương 1',
      topic: params.topics?.[0] || 'Tổng quan',
      knowledgeType: (params.knowledgeTypes?.[0] as any) || 'concept',
      difficulty: (params.difficulty as any) || 'medium'
    }));
  } catch (error) {
    console.error('Error parsing questions:', error);
    return generateMockQuestions(params);
  }
}

function generateMockQuestions(params: GenerateQuestionsParams): Question[] {
  const templates = [
    {
      content: 'Giao thức TCP hoạt động ở tầng nào trong mô hình OSI?',
      options: ['Tầng Vật lý', 'Tầng Liên kết dữ liệu', 'Tầng Mạng', 'Tầng Giao vận'],
      correctAnswer: 3
    },
    {
      content: 'Địa chỉ IP nào sau đây là địa chỉ IP private?',
      options: ['8.8.8.8', '192.168.1.1', '1.1.1.1', '172.217.0.0'],
      correctAnswer: 1
    },
    {
      content: 'Port mặc định của giao thức HTTP là?',
      options: ['21', '22', '80', '443'],
      correctAnswer: 2
    },
    {
      content: 'DNS có chức năng gì?',
      options: ['Định tuyến gói tin', 'Phân giải tên miền', 'Mã hóa dữ liệu', 'Quản lý băng thông'],
      correctAnswer: 1
    },
    {
      content: 'Subnet mask 255.255.255.0 tương đương với ký hiệu CIDR nào?',
      options: ['/8', '/16', '/24', '/32'],
      correctAnswer: 2
    }
  ];

  return Array.from({ length: params.count }, (_, i) => {
    const template = templates[i % templates.length];
    return {
      id: `q-${Date.now()}-${i}`,
      content: `${template.content}`,
      options: template.options,
      correctAnswer: template.correctAnswer,
      chapter: params.chapter || 'Chương 1',
      topic: params.topics?.[0] || 'Tổng quan',
      knowledgeType: (params.knowledgeTypes?.[0] as any) || 'concept',
      difficulty: (params.difficulty as any) || 'medium'
    };
  });
}
