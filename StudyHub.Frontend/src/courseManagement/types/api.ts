export type CourseListItemDto = {
  id: number;
  name: string;
  information?: string | null;
  imageUrl?: string | null;
  price: number;
};

export type CourseDetailDto = {
  id: number;
  name: string;
  information?: string | null;
  imageUrl?: string | null;
  price: number;
  subjectId: number;
  gradeId: number;
  chapters?: ChapterDto[];
};

export type ChapterDto = {
  id: number;
  name: string;
  lessons: LessonDto[];
};

export type LessonDto = {
  id: number;
  name: string;
  isPreview: boolean;
  type: string;
  content: string;
};
