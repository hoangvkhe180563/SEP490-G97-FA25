// StudyHub.Frontend/src/forumManagement/interfaces/forum.ts
import type { Comment } from "./comment";

export interface Post {
  post_id: number;
  school_id: number;
  subject_id: number;
  subject_name: string;
  flair_id: number;
  flair_name: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  author_name: string;
  author_initials: string;
  author_class: string;
  comment_count: number;
  comments: Comment[];
  image_urls: string;
  status?: boolean | null;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Flair {
  id: number;
  name: string;
  schoolId?: number;
}
