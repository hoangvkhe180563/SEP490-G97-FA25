export interface Exam {
  id: number,
  title: string,
  description: string,
  duration: number,
  createdBy: string,
  totalQuestions?: number
}