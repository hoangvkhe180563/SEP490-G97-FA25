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
}
interface MessageState {
  messages: Message[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getMessagesByConversationId: (conversationId: string) => Promise<void>;
  sendMessage: (message: CreateMessageDTO) => Promise<void>;
  updateMessage: (id: string, dto: any) => Promise<void>;
  getAllMessages: () => Promise<void>;
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
  students: AppUser[];
  connectedStudents: AppUser[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getTeachers: () => Promise<void>;
  getConnectedTeachers: () => Promise<void>;
  getStudents: () => Promise<void>;
  getConnectedStudents: () => Promise<void>;
}
export type { ConversationState, MessageState, TopicState, AppUserState };
