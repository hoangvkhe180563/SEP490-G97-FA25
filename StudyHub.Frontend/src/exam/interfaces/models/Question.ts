export interface Question {
  id: number,
  questionObjectId?: string,
  questionText: string,
  type: "single-choice" | "multiple-choice" | "text-input" | "fill-blank" | "matching",
  options: string[],
  correctAnswer: any,
  terms?: string[],
  definitions?: string[]
}
