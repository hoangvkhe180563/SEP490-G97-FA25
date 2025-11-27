import type { Question } from "../models/Question";

export interface ExcelQuestionResponse {
  questions: Question[];
  errorMessages: string[];
}