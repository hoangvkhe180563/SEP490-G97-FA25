export type CourseStatus = "Published" | "Draft" | "Archived";

export type Course = {
  id: string;
  image?: string;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  duration?: string;
  students?: string | number;
  status?: CourseStatus;
  createdAt?: string;
  updatedAt?: string;
  subtitle?: string;
  totalLessons?: number;
  totalStudents?: number;
  completionRate?: string;
  avgRating?: number;
  price?: number | string;
};

export type Chapter = {
  id: string;
  title: string;
  lessons?: { id: string; title: string; duration?: string }[];
};
