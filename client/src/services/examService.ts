import api from "./api";

export interface QuizItem {
  id: string;
  title: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  questions?: any[];
  duration?: number;
  settings?: { chapter?: string; difficulty?: string };
}

export interface PaginatedQuizzes {
  data: QuizItem[];
  total: number;
  page: number;
  page_size: number;
}

export const fetchQuizzes = async (params: {
  search?: string;
  user_id?: string;
  page?: number;
  page_size?: number;
}) => {
  const resp = await api.get("/quizzes", { params });
  return resp.data as PaginatedQuizzes;
};
