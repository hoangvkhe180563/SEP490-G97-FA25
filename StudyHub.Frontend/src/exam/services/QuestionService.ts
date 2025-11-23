import { axiosInstance } from "@/lib/axios";
import type { CommonQuestionResponse } from "../interfaces/responses/CommonQuestionResponse";
import type { Question } from "../interfaces/models/Question";
import type { Subject } from "../interfaces/models/Subject";

export class QuestionService {
  getCommonQuestions = async (subjectId: number, grade: number, type: number, page: number, questionText: string): Promise<CommonQuestionResponse | null> => {
    if (subjectId <= 0) {
      return null;
    }

    const params: any = {
      subjectId
    }
    if (grade > 0) {
      params.grade = grade;
    }
    if (type > -1) {
      params.type = type;
    }
    if (page > 1) {
      params.page = page;
    }
    if (questionText) {
      params.questionText = questionText;
    }

    try {
      const res = await axiosInstance.get("question", { params });
      if (res.status === 200) {
        const data = res.data;
        return {
          page: data.page,
          totalPages: data.totalPages,
          totalQuestions: data.totalQuestions,
          questions: data.questions
        }
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getCommonQuestions: ", error);
    }
    return null;
  }

  addCommonQuestions = async (questions: Question[]): Promise<boolean> => {
    if (questions.length === 0) {
      return false;
    }
    try {
      const res = await axiosInstance.post("question/common", questions, {
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
      console.error("Error addCommonQuestions: ", error);
    }
    return false;
  }

  updateCommonQuestion = async (question: Question): Promise<boolean> => {
    if (!question.questionObjectId || question.questionObjectId.length <= 0) {
      return false;
    }
    try {
      const res = await axiosInstance.post("question/common", question, {
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
      console.error("Error updateCommonQuestion: ", error);
    }
    return false;
  }

  deleteCommonQuestion = async (questionObjectId: string): Promise<boolean> => {
    if (questionObjectId.length <= 24) {
      return false;
    }
    try {
      const res = await axiosInstance.delete(`question/${questionObjectId}`);
      if (res.status === 200) {
        return true;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error deleteCommonQuestion: ", error);
    }
    return false;
  }

  getManagerSubjects = async (managerId: string): Promise<Subject[]> => {
    if (managerId.length < 36) {
      return [];
    }
    try {
      const res = await axiosInstance.get(`question/${managerId}/subjects`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getManagerSubjects: ", error);
    }
    return [];
  }

  getQuestionDetail = async (id: string): Promise<Question | null> => {
    if (id.length === 0) {
      return null;
    }
    try {
      const res = await axiosInstance.get(`question/${id}/details`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getQuestionDetail: ", error);
    }
    return null;
  }
}