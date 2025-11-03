import type { Answer } from "./Answer";

export interface ExamResult {
  id: number,
  examId: number,
  studentId: number,
  submissionDate?: Date,
  score?: number,
  totalQuestions: number,
  answers: Answer[],
  cheatTimes: number
}