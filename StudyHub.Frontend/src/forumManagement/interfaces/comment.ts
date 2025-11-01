// StudyHub.Frontend/src/forumManagement/interfaces/comment.ts
export interface Comment {
  comment_id: number;
  post_id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: string;
  created_by: string;
  author_name: string;
  author_initials: string;
  replies?: Comment[];
  image_urls: string;
}
