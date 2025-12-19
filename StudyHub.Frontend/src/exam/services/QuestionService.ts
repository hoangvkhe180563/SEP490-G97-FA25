import { axiosInstance } from "@/lib/axios";
import type { CommonQuestionResponse } from "../interfaces/responses/CommonQuestionResponse";
import type { Question } from "../interfaces/models/Question";
import type { Subject } from "../interfaces/models/Subject";
import type { ExcelQuestionResponse } from "../interfaces/responses/ExcelQuestionResponse";
import type { QuestionOverviewResponse } from "../interfaces/responses/QuestionOverviewResponse";
import type { QuestionDetailOverviewResponse } from "../interfaces/responses/QuestionDetailOverviewResponse";
import type { AIQuestionResponse } from "../interfaces/responses/AIQuestionResponse";
import { EXAM_TYPE } from "../constants/Constants";

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

  getTotalQuestions = async (subjectId: number, grade: number): Promise<number> => {
    if (subjectId === 0 || grade === 0) {
      return 0;
    }

    try {
      const res = await axiosInstance.get("question", {
        params: {
          subjectId,
          grade
        }
      });
      if (res.status === 200) {
        const data = res.data;
        return data.totalQuestions;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getTotalQuestions: ", error);
    }
    return 0;
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
      const res = await axiosInstance.put("question/common", question, {
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
    if (questionObjectId.length < 24) {
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

  getAllSubjects = async (): Promise<Subject[]> => {
    try {
      const res = await axiosInstance.get(`subject/allsubject`);
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

  importExcel = async (file: File): Promise<ExcelQuestionResponse> => {
    try {
      const formData = new FormData();
      formData.append("excelFile", file);
      const res = await axiosInstance.post("/question/excel", formData);
      if (res.status === 200) {
        return {
          errorMessages: [],
          questions: res.data.map((item: Question, index: number) => {
            return {
              ...item,
              id: Date.now() + index
            }
          })
        }
      } else {
        return {
          errorMessages: res.data,
          questions: []
        };
      }
    } catch (error: any) {
      console.error("Error importExcel: ", error);
      return {
        errorMessages: error.response.data,
        questions: []
      };
    }
  }

  getQuestionDashboardOverview = async (managerId: string): Promise<QuestionOverviewResponse> => {
    if (managerId.length < 36) {
      return {
        totalGrades: 0,
        totalQuestions: 0,
        totalSubjects: 0
      }
    }
    try {
      const res = await axiosInstance.get(`question/dashboard-overview/${managerId}`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getQuestionDashboardOverview: ", error);
    }
    return {
      totalGrades: 0,
      totalQuestions: 0,
      totalSubjects: 0
    }
  }

  getQuestionStatistics = async (managerId: string): Promise<QuestionDetailOverviewResponse[]> => {
    if (managerId.length < 36) {
      return [];
    }
    try {
      const res = await axiosInstance.get(`question/question-statistics/${managerId}`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getQuestionStatistics: ", error);
    }
    return [];
  }

  generateAIQuestions = async (subjectId: number, grade: number, prompt: string): Promise<Question[]> => {
    const payload = {
      userMessage: prompt,
      subjectId,
      grade
    }
    try {
      const res = await axiosInstance.post('/Recommendation/generate-quiz', payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        const generatedQuestions = res.data.generatedQuestions as AIQuestionResponse[];
        const questions: Question[] = generatedQuestions.map((generated, index) => {
          let correctAnswer;
          switch (generated.questionType) {
            case EXAM_TYPE.SINGLE_CHOICE: {
              correctAnswer = generated.correctAnswerIndex
              break;
            }
            case EXAM_TYPE.MULTI_CHOICE: {
              correctAnswer = generated.correctAnswerIndexes
              break;
            }
            case EXAM_TYPE.TEXT_INPUT: {
              correctAnswer = generated.correctAnswerText
              break;
            }
            case EXAM_TYPE.FILL_IN_BLANK: {
              correctAnswer = generated.correctAnswers
              break;
            }
            case EXAM_TYPE.MATCHING: {
              correctAnswer = generated.correctAnswerMap
              break;
            }
          }
          return {
            id: Date.now() + index,
            questionText: generated.questionText,
            type: generated.questionType,
            options: generated.options ?? [],
            correctAnswer: correctAnswer,
            terms: generated.terms ?? [],
            definitions: generated.definitions ?? []
          }
        })

        return questions
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error generateAIQuestions: ", error);
    }
    return [];
  }
}