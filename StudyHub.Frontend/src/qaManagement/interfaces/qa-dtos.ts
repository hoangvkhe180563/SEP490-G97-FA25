export interface TopicCountDto {
  topic: string;
  count: number;
}

export interface SubjectCountDto {
  subject: string;
  count: number;
}

export interface TeacherStatsDto {
  teacherId: string;
  fullName?: string | null;
  conversationCount: number;
  averageFirstResponseMinutes: number;
}

export interface QaOverviewDto {
  totalConversations: number;
  totalMessages: number;
  conversationsBySubject: SubjectCountDto[];
  conversationsByTopic: TopicCountDto[];
  averagePaidConversations: { day: number; week: number; month: number };
  averageMessages: { day: number; week: number; month: number };
  topStudents: {
    userId: string;
    fullName?: string | null;
    totalQuestions: number;
  }[];
  topSubjects: SubjectCountDto[];
}
