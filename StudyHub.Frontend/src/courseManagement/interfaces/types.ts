export type LessonListDto = {
  id: number;
  name: string;
  chapterId: number;
  status: boolean | null;
  type: string;
  videoUrl: string | null;
  readingContent: string | null;

  // New fields
  duration: string | null;
  description: string | null;
  postDate: Date | null;
  isPreview?: boolean;
};

export type ChapterListDto = {
  id: number;
  name: string;
  courseId: number;
  status: boolean | null;
  lessons: LessonListDto[];

  // New fields
  description: string | null;
  postDate: Date | null;
};

export type CourseListDto = {
  id: number;
  name: string;
  information: string | null;
  imageUrl: string | null;
  price?: number;
  grade?: number;
  category?: number | null;
  schoolId?: number | null;
  isFeatured?: boolean;
  status?: boolean | null;
  createdAt?: string;
  instructorName?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  chapters?: ChapterListDto[];
};

export type CourseStatus = "Published" | "Draft" | "Archived";

export type LessonDto = {
  name: string;
  chapterId: number;
  status: boolean | null;
  type: string;
  videoUrl: string | null;
  readingContent: string | null;

  // New fields
  duration: string | null;
  description: string | null;
  postDate: Date | null;
  isPreview?: boolean;
};

export type ChapterDto = {
  name: string;
  courseId: number;
  status: boolean | null;
  lessons: LessonListDto[];

  // New fields
  description: string | null;
  postDate: Date | null;
};

export type CourseDetailDto = {
  name: string;
  information: string | null;
  imageUrl: string | null;
  price?: number;
  grade?: number;
  category?: number | null;
  schoolId?: number | null;
  isFeatured?: boolean;
  status?: boolean | null;
  createdAt?: string;
  instructorName?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  chapters?: ChapterListDto[];
};
