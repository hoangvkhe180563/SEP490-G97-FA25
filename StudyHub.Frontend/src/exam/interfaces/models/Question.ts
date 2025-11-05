export interface Question {
  id: number,
  questionText: string,
  type: "single-choice" | "multiple-choice" | "text-input" | "fill-blank",
  options: string[],
  correctAnswer: any
}