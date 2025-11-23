import type { Exam } from "../interfaces/models/Exam";
import type { ExamResult } from "../interfaces/models/ExamResult";

export const EXAM_TYPE = {
  SINGLE_CHOICE: 0,
  MULTI_CHOICE: 1,
  TEXT_INPUT: 2,
  FILL_IN_BLANK: 3,
  MATCHING: 4
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
  isMultipleAttempts: false,
  openTime: new Date()
}

export const DEFAULT_EXAM_RESULT: ExamResult = {
  id: '',
  examId: 0,
  score: 0,
  studentId: '',
  answers: [],
  cheatTimes: 0,
  finishTime: new Date()
}