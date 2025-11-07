import { axiosInstance } from "@/lib/axios";
import { DEFAULT_EXAM, DEFAULT_EXAM_RESULT } from "../constants/Constants";
import type { Exam } from "../interfaces/models/Exam";
import type { ExamResult } from "../interfaces/models/ExamResult";
import { MOCK_DATA_EXAMS } from "./MockData";
import { formatISO } from "date-fns";

export class ExamService {

  createExam = async (examData: Exam): Promise<boolean> => {
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

  getClassExams = async (classId: string): Promise<Exam[]> => {
    try {
      const res = await axiosInstance.get("/exam/class/" + classId);
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
      console.error("Error getClassExams: ", error);
    }
    return [];
  }

  getExamById = async (id: number, retrieveQuestions: boolean = false): Promise<Exam> => {
    try {
      const res = await axiosInstance.get(`/exam/${id}?retrieveQuestions=${retrieveQuestions}`);
      if (res.status === 200) {
        const data = res.data;
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          openTime: new Date(data.openTime),
          closeTime: data.closeTime && new Date(data.closeTime),
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

  getResultsByExamId = async (examId: number): Promise<ExamResult[]> => {
    try {
      const res = await axiosInstance.get("/examResult/by-exam/" + examId);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            examId: item.examId,
            studentId: item.studentId,
            studentName: item.studentName,
            finishTime: new Date(item.finishTime),
            submissionTime: new Date(item.submissionTime),
            score: item.score,
            cheatTimes: item.cheatTimes
          }
        });
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getResultsByExamId: ", error);
    }
    return [];
  }

  createResult = async (resultData: ExamResult): Promise<string> => {
    const payload = {
      ...resultData,
      finishTime: formatISO(resultData.finishTime)
    }
    try {
      const res = await axiosInstance.post("/examResult", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error createResult: ", error);
    }
    return '';
  }

  updateResult = async (resultData: ExamResult): Promise<boolean> => {
    const payload = {
      ...resultData,
      submissionTime: resultData.submissionTime && formatISO(resultData.submissionTime)
    }
    try {
      const res = await axiosInstance.put("/examResult", payload, {
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
      console.error("Error createResult: ", error);
    }
    return false;
  }

  submitResult = async (resultId: string): Promise<boolean> => {
    try {
      const res = await axiosInstance.put(`/examResult/${resultId}/submit`, {
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
      console.error("Error createResult: ", error);
    }
    return false;
  }

  getResultsByStudentAndExamId = async (studentId: string, examId: number): Promise<ExamResult[]> => {
    try {
      const res = await axiosInstance.get(`/examResult/by-exam/${examId}/${studentId}`);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            studentId: item.studentId,
            studentName: item.studentName,
            examId: item.examId,
            submissionTime: new Date(item.submissionTime),
            score: item.score,
            cheatTimes: item.cheatTimes
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

  getResultDetail = async (id: string): Promise<ExamResult> => {
    try {
      const res = await axiosInstance.get("/examResult/" + id);
      if (res.status === 200) {
        const data = res.data;
        const answers = data.answers.map((ans: any) => {
          return {
            questionId: ans.questionId,
            jsonAnswers: JSON.parse(ans.jsonAnswers),
            isCorrect: ans.isCorrect
          }
        })
        return {
          id: data.id,
          examId: data.examId,
          studentId: data.studentId,
          studentName: data.studentName,
          cheatTimes: data.cheatTimes,
          answers: answers,
          finishTime: data.finishTime,
          submissionTime: new Date(data.submissionTime),
          score: data.score
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
      console.error("Error getLessonName: ", error);
    }
    return '';
  }

  checkExamStatus = async (studentId: string, examId: number): Promise<boolean> => {
    try {
      const res = await axiosInstance.get(`/examResult/by-exam/${examId}/${studentId}/status`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error checkExamStatus: ", error);
    }
    return false;
  }
}