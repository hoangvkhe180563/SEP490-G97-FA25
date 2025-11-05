import type { Answer } from "./Answer";

export interface ExamResult {
  id: number,
  examId: number,
  studentId: string,
  studentName?: string,
  finishDate: Date,
  submissionTime?: Date,
  score?: number,
  totalQuestions: number,
  answers: Answer[],
  cheatTimes: number
}