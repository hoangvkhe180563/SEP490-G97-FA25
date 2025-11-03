import { DEFAULT_EXAM, DEFAULT_EXAM_RESULT } from "../constants/Constants";
import type { Exam } from "../interfaces/models/Exam";
import type { ExamResult } from "../interfaces/models/ExamResult";
import { MOCK_DATA_EXAMS, MOCK_DATA_RESULTS } from "./MockData";

export class ExamService {

  createExam = (examData: Exam) => {
    console.log("Creating exam: ", examData);
  }

  getExams = (): Exam[] => {
    return MOCK_DATA_EXAMS;
  }

  getExamById = async (id: number): Promise<Exam> => {
    return MOCK_DATA_EXAMS.find(exam => exam.id === id) ?? DEFAULT_EXAM;
  }

  updateExam = (id: number, examData: Exam) => {
    console.log("Updating exam with id = " + id + "...");
    console.log("exam data: ", examData);
  }

  getResultsByExamId = (examId: number): ExamResult[] => {
    return MOCK_DATA_RESULTS.filter(result => result.examId === examId);
  }

  backupResult = async (resultData: ExamResult): Promise<boolean> => {
    console.log("Backup data: ", resultData);
    return true;
  }

  getResultsByStudent = (studentId: number): ExamResult[] => {
    return MOCK_DATA_RESULTS.filter(result => result.studentId === studentId);
  }

  getAllTeacherResults = (id: number): ExamResult[] => {
    const examIds = MOCK_DATA_EXAMS.filter(exam => exam.createdBy === id).map(exam => exam.id);
    return MOCK_DATA_RESULTS.filter(result => examIds.includes(result.examId));
  }

  getResultDetail = (id: number): ExamResult => {
    return MOCK_DATA_RESULTS.find(result => result.id === id) ?? DEFAULT_EXAM_RESULT;
  }

  getClassName = async (classId: number): Promise<string> => {
    console.log("retrieving Class Name from Class " + classId);
    return "ClassName";
  }

  getLessonName = async (lessonId: number): Promise<string> => {
    console.log("retrieving Lesson Name from Lesson " + lessonId);
    return "LessonName";
  }
}