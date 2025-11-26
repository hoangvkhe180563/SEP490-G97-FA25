import type { Question } from "../models/Question";

export interface CommonQuestionResponse {
  questions: Question[];
  page: number;
  totalPages: number;
  totalQuestions: number;
}