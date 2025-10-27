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
  chapters?: ChapterListDto[];
};

export type CourseStatus = "Mở" | "Đóng" | "Nháp";

export type LessonResource = {
  id: number;
  url: string;
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
  chapters?: ChapterDto[];
};
