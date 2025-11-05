import type { Answer } from "./Answer";

export interface ExamResult {
  id: string,
  examId: number,
  studentId: string,
  studentName?: string,
  finishTime: Date,
  submissionTime?: Date,
  score?: number,
  answers: Answer[],
  cheatTimes: number
}