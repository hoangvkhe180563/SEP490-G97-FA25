export interface AIQuestionResponse {
  questionText: string;
  questionType: number;
  options: string[] | null;
  correctAnswerIndex: number | null;
  correctAnswerIndexes: number[] | null;
  correctAnswerText: string | null;
  correctAnswers: string[] | null;
  terms: string[] | null;
  definitions: string[] | null;
  correctAnswerMap: any | null
}