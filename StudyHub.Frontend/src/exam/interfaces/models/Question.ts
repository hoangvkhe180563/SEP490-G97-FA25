export interface Question {
  id: number,
  questionObjectId?: string,
  questionText: string,
  type: number,
  options: string[],
  correctAnswer: any,
  terms?: string[],
  definitions?: string[],
  subjectId?: number,
  grade?: number
}
