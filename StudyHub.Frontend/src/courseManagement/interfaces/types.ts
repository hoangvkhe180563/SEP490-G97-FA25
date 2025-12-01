export type ProgressListDto = {
  Id: number;
  EnrollmentId: number;
  LessonId: number;
  CompletionDate: Date;
};

export type EnrollmentListDto = {
  Id: number;
  AppUserId: string;
  CourseId: number;
  EnrollmentDate: Date;
};

export type LessonListDto = {
  id: number;
  name: string;
  chapterId: number;
  type: string;
  videoUrl?: string | null;
  readingContent?: string | null;
  ExamContent?: string | null;
  duration?: string | null;
  description?: string | null;
  postDate?: Date | null;
  isPreview: boolean;
  resourceId?: number | null;
};

export type ChapterListDto = {
  id: number;
  name: string;
  courseId: number;
  description?: string | null;
  postDate?: Date | null;
  lessons: LessonListDto[];
};

export type CourseListDto = {
  id: number;
  name: string;
  information: string | null;
  imageUrl: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  length: "Short" | "Medium" | "Long";
  price: number;
  grade: number;
  subjectId: number;
  subjectName: string;
  schoolId: number | null;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  createdBy: string;
  isApproved: boolean;
  chapters?: ChapterListDto[];
};

export interface DialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  navigateTo?: string;
}

export type CourseStatus = "Open" | "Closed" | "Draft" | "Requested" | "Edited";

export type LessonResource = {
  id: number;
  url: string;
};

export type ProgressDto = {
  EnrollmentId: number;
  LessonId: number;
  CompletionDate: Date;
};

export type EnrollmentDto = {
  AppUserId: string;
  CourseId: number;
  EnrollmentDate: Date;
};

export type LessonDto = {
  name: string;
  chapterId: number;
  type: string;
  videoUrl?: string | null;
  readingContent?: string | null;
  ExamContent?: string | null;
  duration?: string | null;
  description?: string | null;
  postDate?: Date | null;
  isPreview: boolean;
  ResourceId?: number | null;
};

export type ChapterDto = {
  name: string;
  courseId: number;
  description?: string | null;
  postDate?: Date | null;
  lessons: LessonDto[];
};

export type CourseDetailDto = {
  name: string;
  information: string | null;
  imageUrl: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  length: "Short" | "Medium" | "Long";
  price: number;
  grade: number;
  SubjectId: number;
  schoolId: number | null;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  createdBy: string;
  isApproved: boolean;
  chapters?: ChapterDto[];
};

export type CommentDto = {
  id: number;
  lessonId: number;
  appUserId: string;
  content: string;
  createdAt: string;
  userFullname?: string;
  userAvatar?: string | null;
};

export interface Question {
  id: number;
  questionObjectId?: string;
  questionText: string;
  type: number;
  options: string[];
  correctAnswer: any;
  terms?: string[];
  definitions?: string[];
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  duration: number;
  createdBy?: string;
  questions: Question[];
  showAnswers: boolean;
  showCorrectAnswers: boolean;
  totalQuestions?: number;
  classId?: number;
  lessonId?: number;
  openTime: Date;
  closeTime?: Date;
  noRandomQuestions?: number;
  subjectId?: number;
  grade?: number;
}

export interface LessonExamStatus {
  latestTime: Date;
  isDisabled: boolean;
}
