import type { Answer } from "../interfaces/models/Answer";
import type { Exam } from "../interfaces/models/Exam";
import type { ExamResult } from "../interfaces/models/ExamResult";
import type { Question } from "../interfaces/models/Question";

export const EXAM_TYPE = {
  SINGLE_CHOICE: "single-choice",
  MULTI_CHOICE: "multiple-choice",
  TEXT_INPUT: "text-input",
  FILL_IN_BLANK: "fill-blank"
}

export const BLANK_PLACEHOLDER = "[BLANK]";

export const DEFAULT_EXAM: Exam = {
  id: 0,
  title: '',
  createdBy: '',
  duration: 0,
  description: '',
  questions: [],
  showAnswers: true,
  showCorrectAnswers: false,
  openTime: new Date()
}

export const DEFAULT_EXAM_RESULT: ExamResult = {
  id: 0,
  examId: 0,
  score: 0,
  studentId: '',
  totalQuestions: 0,
  answers: [],
  cheatTimes: 0,
  finishDate: new Date()
}

export const DEFAULT_ANSWER: Answer = {
  questionId: 0,
  studentAnswer: null,
  isCorrect: false
}