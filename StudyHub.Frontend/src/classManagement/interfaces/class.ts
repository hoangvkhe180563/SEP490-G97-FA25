// interfaces/class.ts (Tạo file mới)

import type { Subject } from "@/classManagement/interfaces/subject";

export interface ClassListDto {
  id: number;
  name: string; 
  subjectName: string; 
  subjectId:number;
  instructorName: string; 
  description?: string;
}
export type ClassInfo = {
  id: number;
  name: string;
  subjectId: number;
  description: string;
  createdAt: string;
};

export type ClassMemberDto = {
  userId: string;
  fullname: string;
  roles: string[];
  joinDate: string;
};

export type ClassNotification = {
  id: number;
  title: string;
  description: string;
};

export interface ClassDetailResponse {
  success: boolean;
  message: string;
  data: {
    classInfo: ClassInfo;
    teacher: ClassMemberDto | null;
    students: ClassMemberDto[];
    parents: ClassMemberDto[];
    notifications: ClassNotification[];
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetClassesResponse {
  success: boolean;
  classes: ClassListDto[];
  message: string;
  meta?: Meta;
}

export interface ClassState {
  classes: ClassListDto[];
  subjects: Subject[], 
  currentClass?: ClassDetailResponse | null;
  isLoading: boolean;
  success: boolean;
  message: string;
  meta?: Meta | null;

  getClasses: (query: string) => Promise<GetClassesResponse | null>;
  addClass: (payload: { title: string; subject: number; description?: string }) => Promise<boolean>;
  getAllSubjects: () => Promise<void>;
  updateClass: (payload: { id: number; title: string; subject: number; description?: string }) => Promise<boolean>;
  getClassDetail: (id: number) => Promise<ClassDetailResponse | null>;
}