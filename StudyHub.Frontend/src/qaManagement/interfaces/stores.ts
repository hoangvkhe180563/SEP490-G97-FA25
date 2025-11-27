import type { AppUser } from "./app-user";
import type { Conversation } from "./conversation";
import type { CreateConversationDTO, CreateMessageDTO } from "./dtos";
import type { Message } from "./message";
import type { Topic } from "./topic";

interface ConversationState {
  conversations: Conversation[];
  conversation: Conversation | null;
  isLoading: boolean;
  success: boolean;
  message: string;
  getConversations: () => Promise<void>;
  getConversationById: (id: string) => Promise<void>;
  createConversation: (conversation: CreateConversationDTO) => Promise<void>;
  getMine: () => Promise<void>;
  getTeachersWithConversationsForCurrentStudent: () => Promise<void>;
  getStudentsWithConversationsForCurrentTeacher: () => Promise<void>;
  // read hub (unread counts)
  startRead?: () => Promise<void>;
  stopRead?: () => Promise<void>;
  upsertRead?: (conversationId: string) => Promise<void>;
}
interface MessageState {
  messages: Message[];
  // realtime/chat
  isChatConnected?: boolean;
  typingUsers?: any[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getMessagesByConversationId: (conversationId: string) => Promise<void>;
  files?: any[];
  getFilesByConversationId?: (conversationId: string) => Promise<void>;
  uploadFile?: (conversationId: string, file: File) => Promise<void>;
  sendMessage: (message: CreateMessageDTO) => Promise<void>;
  updateMessage: (id: string, dto: any) => Promise<void>;
  getAllMessages: () => Promise<void>;
  startChat?: () => Promise<void>;
  stopChat?: () => Promise<void>;
  joinConversation?: (conversationId: string) => Promise<void>;
  leaveConversation?: (conversationId: string) => Promise<void>;
  sendTyping?: (conversationId: string, isTyping: boolean) => Promise<void>;
}

interface TopicState {
  topics: Topic[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getTopics: () => Promise<void>;
  getTopicsBySubject: (subjectId: number) => Promise<void>;
  createTopic: (dto: any) => Promise<void>;
}

interface AppUserState {
  teachers: AppUser[];
  connectedTeachers: AppUser[];
  subjectTeachers?: AppUser[]; // teachers filtered by currently selected subject
  subjectTeachersLoading?: boolean;
  subjectTeachersError?: string | null;
  students: AppUser[];
  connectedStudents: AppUser[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getTeachers: () => Promise<void>;
  getTeachersBySubject: (subjectId: number) => Promise<void>;
  getConnectedTeachers: () => Promise<void>;
  getStudents: () => Promise<void>;
  getConnectedStudents: () => Promise<void>;
  getUserStatus: (userId: string) => Promise<any | null>;
}
export type { ConversationState, MessageState, TopicState, AppUserState };
