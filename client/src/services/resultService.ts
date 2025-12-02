// client/src/services/resultService.ts
import api from "./api";

export interface ResultItem {
  id: string;
  user_id: string;
  exam_id: string;
  exam_title: string;
  score: number;
  submitted_at?: string;
}

export const fetchMyResults = async (search?: string) => {
  const resp = await api.get("/results/me", { params: { search } });
  return resp.data as ResultItem[];
};
