// (updated) Type definitions for class management state and DTOs
import type { Subject } from "@/classManagement/interfaces/subject";
import type { PostComment } from "../components/ui/postcard";

export interface ClassListDto {
  id: number;
  name: string; 
  instructorName: string; 
  description?: string;
}

export type ClassInfo = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
};

export type ClassMemberDto = {
  userId: string;
  fullname: string;
  roles: string[];
  joinDate: string;

  email?: string | null;
  gender?: boolean | number | string; 
  schoolId?: number | null;
  schoolName?: string | null;
  address?: string | null;
  communeId?: number | null;
  communes?: string | null; 
  phoneNumber?: string | null;
  wallet?: number;

  avatarUrl?: string | null;
  [key: string]: any;
};

export type ClassNotificationFile = {
  id: number;
  fileName: string;
  fileUrl: string;
};

export type ClassNotification = {
  id: number;
  classId: number;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  files: ClassNotificationFile[];
  comments: PostComment[]; // có thể mở rộng sau
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
    works?: ClassWork[];
  };
}
export type LinkPayload = {
  url: string;
  title?: string;
  thumbnail?: string;
};

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
export type ClassWork = {
  id: number;
  classId: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  [key: string]: any;
};
export type ClassworkSubmissionFile = {
  id: number;
  fileName: string;
  fileUrl: string;
};

export type ClassworkSubmission = {
  id: number;
  classworkId: number;
  appUserId: string;
  firstSubmissionTime: string;
  latestSubmissionTime: string;
  files: ClassworkSubmissionFile[];
  score: number | string | null;
  feedback?: string | null;
};
export interface ClassState {
  classes: ClassListDto[];
  subjects: Subject[];
  currentClass: ClassDetailResponse; // store keeps a default non-null currentClass
  isLoading: boolean;
  success: boolean;
  message: string;
  meta?: Meta | null;

  getClasses: (query: string,memberUserId?: string) => Promise<GetClassesResponse | null>;
  addClass: (payload: { title: string; description?: string }) => Promise<any | null>;
  getAllSubjects: () => Promise<Subject[]>;
  updateClass: (payload: { id: number; title: string; description?: string }) => Promise<any | null>;

 
  getClassInfo: (id: number) => Promise<ClassDetailResponse | null>;
  
  getClassMembers: (id: number) => Promise<ClassMemberDto[] | null>;

  createNotification: (payload: {
    classId: number;
    title: string;
    description?: string;
    createdBy: string;
    files?: File[] | null;
    links?: LinkPayload[];
  }) => Promise<ClassNotification | null>;
  addComment: (payload: {
    notificationId: number|string;
    userId: string;
    content: string;
  }) => Promise<PostComment | null>;
  deleteNotification: (notificationId: number | string) => Promise<boolean>;
  inviteMembers: (classId: number, emails: string[], role?: string) => Promise<any | null>;
  getClassWorks: (classId: number) => Promise<ClassWork[] | null>;
   createClasswork: (payload: { classId: number; title: string; description?: string; deadline?: string }) => Promise<ClassWork | null>;
  editClasswork: (payload: { id: number; classId: number; title: string; description?: string; deadline?: string }) => Promise<ClassWork | null>;
  submitClasswork: (classworkId: number, appUserId: string, files: File[],links?: LinkPayload[]) => Promise<any | null>;
  getClassworkSubmissions: (classworkId: number) => Promise<ClassworkSubmission[] | null>;

  // NEW: fetch a single submission for a given user + classwork
  getSubmissionByUserAndClasswork: (classworkId: number, appUserId: string) => Promise<ClassworkSubmission | null>;
}