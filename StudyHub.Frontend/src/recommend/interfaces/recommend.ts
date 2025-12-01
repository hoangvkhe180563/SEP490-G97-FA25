export interface CourseRecommendation {
  id: number | string;
  name?: string;
  title?: string;
  subjectName?: string;
  subject?: string;
  difficulty?: string;
  length?: string;
  grade?: number;
  information?: string;
  score?: number;
  reason?: string;
  imageUrl?: string;
  price?: number;
  startAt?: string;
  endAt?: string;
  createdByName?: string;
}

export interface DocumentRecommendation {
  id: number | string;
  name?: string;
  title?: string;
  subjectName?: string;
  subject?: string;
  documentLevel?: string;
  documentLengthType?: string;
  grade?: number;
  description?: string;
  score?: number;
  thumbnail?: string;
  documentUrl?: string;
  documentCategoryName?: string;
  documentCategoryDescription?: string;
  updatedAt?: string;
}

export interface RecommendationResponse {
  userId: string;
  totalCourseRecommendations: number;
  totalDocumentRecommendations: number;
  courses: CourseRecommendation[];
  documents: DocumentRecommendation[];
}

export interface LLMProfile {
  subject?: string[];
  courseLevel?: string;
  documentLevel?: string;
  goal?: string;
  preferredLength?: string;
  grade?: number;
  topicKeywords?: string[];
}

export interface LLMRecommendationResponse {
  profile?: LLMProfile;
  courseRecommendations?: CourseRecommendation[];
  documentRecommendations?: DocumentRecommendation[];
  courseExplanation?: string;
  documentExplanation?: string;
  courseTotalResults?: number;
  documentTotalResults?: number;
  totalPromptTokens?: number;
  totalResponseTokens?: number;
}

// --- Statistics DTOs ---
export interface StudentQuestionStatsDto {
  userId: string;
  fullName?: string;
  totalQuestions: number;
}

export interface DateCountDto {
  period: string; // yyyy-MM-dd or yyyy-W{week} or yyyy-MM
  count: number;
}

export interface HourCountDto {
  hour: number;
  count: number;
}

export interface SubjectCountDto {
  subject: string;
  count: number;
}

export interface TokenSummaryDto {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  averageTokensPerQuestion: number;
}

export interface DateTokenDto {
  period: string; // yyyy-MM-dd or yyyy-W{week} or yyyy-MM
  tokens: number;
}

export interface UserTokenDto {
  userId: string;
  fullName?: string;
  totalTokens: number;
}
