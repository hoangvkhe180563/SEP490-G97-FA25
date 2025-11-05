import { axiosInstance } from "@/lib/axios";
import { DEFAULT_EXAM, DEFAULT_EXAM_RESULT } from "../constants/Constants";
import type { Exam } from "../interfaces/models/Exam";
import type { ExamResult } from "../interfaces/models/ExamResult";
import { MOCK_DATA_EXAMS, MOCK_DATA_RESULTS } from "./MockData";
import { formatISO } from "date-fns";

export class ExamService {

  createExam = async (examData: Exam): Promise<boolean> => {
    console.log(examData.questions);
    const payload = {
      ...examData,
      openTime: formatISO(examData.openTime),
      closeTime: examData.closeTime && formatISO(examData.closeTime)
    }
    try {
      const res = await axiosInstance.post("/exam", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        return true;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getStudentClassExams: ", error);
    }
    return false;
  }

  getExams = (): Exam[] => {
    return MOCK_DATA_EXAMS;
  }

  getStudentClassExams = async (studentId: string): Promise<Exam[]> => {
    try {
      const res = await axiosInstance.get("/exam/class/by-student/" + studentId);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            openTime: item.openTime,
            closeTime: item.closeTime,
            duration: item.duration,
            createdBy: item.createdBy,
            showAnswers: item.showAnswers,
            showCorrectAnswers: item.showCorrectAnswers,
            totalQuestions: item.totalQuestions
          }
        });
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getStudentClassExams: ", error);
    }
    return [];
  }

  getTeacherClassExams = async (teacherId: string): Promise<Exam[]> => {
    try {
      const res = await axiosInstance.get("/exam/class/by-teacher/" + teacherId);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            openTime: item.openTime,
            closeTime: item.closeTime,
            duration: item.duration,
            createdBy: item.createdBy,
            showAnswers: item.showAnswers,
            showCorrectAnswers: item.showCorrectAnswers,
            totalQuestions: item.totalQuestions
          }
        });
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getTeacherClassExams: ", error);
    }
    return [];
  }

  getExamById = async (id: number): Promise<Exam> => {
    try {
      const res = await axiosInstance.get("/exam/" + id);
      if (res.status === 200) {
        const data = res.data;
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          openTime: data.openTime,
          closeTime: data.closeTime,
          classId: data.classId === 0 ? undefined : data.classId,
          lessonId: data.lessonId === 0 ? undefined : data.lessonId,
          duration: data.duration,
          createdBy: data.createdBy,
          showAnswers: data.showAnswers,
          showCorrectAnswers: data.showCorrectAnswers,
          totalQuestions: data.totalQuestions,
          questions: data.questions
        };
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getExamById: ", error);
    }
    return DEFAULT_EXAM;
  }

  updateExam = async (examData: Exam): Promise<boolean> => {
    try {
      const updateQuestionRes = await axiosInstance.put(`/exam/${examData.id}/update-questions`, examData.questions, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (updateQuestionRes.status !== 200) {
        throw new Error(`Update questions failed. Status: ${updateQuestionRes.status}`);
      }

      const payload = {
        ...examData,
        questionObjectIds: updateQuestionRes.data,
        openTime: formatISO(examData.openTime),
        closeTime: examData.closeTime && formatISO(examData.closeTime)
      }
      const res = await axiosInstance.put("/exam", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        return true;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error updateExam: ", error);
    }
    return false;
  }

  getResultsByExamId = (examId: number): ExamResult[] => {
    return MOCK_DATA_RESULTS.filter(result => result.examId === examId);
  }

  backupResult = async (resultData: ExamResult): Promise<boolean> => {
    console.log("Backup data: ", resultData);
    return true;
  }

  getClassExamResultsByStudent = async (studentId: string): Promise<ExamResult[]> => {
    try {
      const res = await axiosInstance.get("/examResult/class/by-student/" + studentId);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            openTime: item.openTime,
            closeTime: item.closeTime,
            duration: item.duration,
            createdBy: item.createdBy,
            showAnswers: item.showAnswers,
            showCorrectAnswers: item.showCorrectAnswers
          }
        });
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getClassExamResultsByStudent: ", error);
    }
    return [];
  }

  getAllClassResultsByTeacher = async (teacherId: string): Promise<ExamResult[]> => {
    try {
      const res = await axiosInstance.get("/examResult/class/by-teacher/" + teacherId);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            openTime: item.openTime,
            closeTime: item.closeTime,
            duration: item.duration,
            createdBy: item.createdBy,
            showAnswers: item.showAnswers,
            showCorrectAnswers: item.showCorrectAnswers
          }
        });
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getAllClassResultsByTeacher: ", error);
    }
    return [];
  }

  getResultDetail = async (id: number): Promise<ExamResult> => {
    try {
      const res = await axiosInstance.get("/examResult/by-exam/" + id);
      if (res.status === 200) {
        const data = res.data;
        return {
          id: data.id,
          examId: data.examId,
          studentId: data.studentId,
          studentName: data.studentName,
          cheatTimes: data.cheatTimes,
          answers: data.answers,
          finishDate: data.finishTime,
          submissionTime: data.submissionTime,
          totalQuestions: data.totalQuestions
        }
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getResultDetail: ", error);
    }
    return DEFAULT_EXAM_RESULT;
  }

  getClassName = async (classId: number): Promise<string> => {
    try {
      const res = await axiosInstance.get("/exam/className/" + classId);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getClassName: ", error);
    }
    return '';
  }

  getLessonName = async (lessonId: number): Promise<string> => {
    try {
      const res = await axiosInstance.get("/exam/lessonName/" + lessonId);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getClassExamResultsByStudent: ", error);
    }
    return '';
  }
}