import type { Question } from "./Question";

export interface Exam {
  id: number,
  title: string,
  description: string,
  duration: number,
  createdBy: number,
  questions: Question[],
  showAnswers: boolean,
  showCorrectAnswers: boolean,
  classId?: number,
  lessonId?: number
}