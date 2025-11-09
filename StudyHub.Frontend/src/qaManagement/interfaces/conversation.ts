interface Conversation {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUsername: string;
  studentAvatar: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherUsername: string;
  teacherAvatar: string;
  type: string;
  isPaid: boolean;
  topicId: string;
  topicName: string;
  subjectName: string;
  createdAt: string;
  // frontend-only: number of unread messages for the current user
  unreadCount?: number;
  // whether this conversation is considered read for current user
  isRead?: boolean;
}
export type { Conversation };
