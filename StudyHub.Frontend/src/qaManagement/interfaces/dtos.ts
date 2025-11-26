interface CreateConversationDTO {
  title: string;
  teacherId: string | null;
  topicId: number;
  isPaid: boolean;
}

interface UpdateConversationDTO {
  title: string;
  teacherId: string | null;
  topicId: number;
  isPaid: boolean;
}

interface CreateMessageDTO {
  conversationId: string;
  content: string;
  isFromAi: boolean;
  isPaid: boolean;
  documentIds?: number[];
}

interface UpdateMessageDTO {
  conversationId: string;
  content: string;
  isFromAi: boolean;
  isPaid: boolean;
}

interface CreateQATopicDTO {
  name: string;
  subjectId: number;
  description: string;
  isActive: boolean;
}

// DTO used by frontend components for mapped conversation data
interface ConversationDto {
  id: string;
  title: string;
  isRead?: boolean;
  studentId: string;
  studentName?: string;
  studentEmail?: string | undefined;
  studentUsername?: string | undefined;
  studentAvatar?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  teacherAvatar?: string | null;
  teacherUsername?: string | null;
  type?: string;
  isPaid?: boolean;
  topicId?: number;
  topicName?: string;
  subjectName?: string;
  createdAt: string;
  unreadCount?: number;
}

export type {
  CreateConversationDTO,
  UpdateConversationDTO,
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateQATopicDTO,
  ConversationDto,
};
