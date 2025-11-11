import type { Question } from "./Question";

export interface Exam {
  id: number,
  title: string,
  description: string,
  duration: number,
  createdBy: string,
  questions: Question[],
  showAnswers: boolean,
  showCorrectAnswers: boolean,
  totalQuestions?: number,
  classId?: number,
  lessonId?: number,
  openTime: Date,
  closeTime?: Date
}