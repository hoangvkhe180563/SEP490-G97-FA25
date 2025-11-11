export interface Question {
  id: number,
  questionObjectId?: string,
  questionText: string,
  type: "single-choice" | "multiple-choice" | "text-input" | "fill-blank",
  options: string[],
  correctAnswer: any
}