interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderEmail: string;
  senderUsername: string;
  content: string;
  isFromAi: boolean;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export type { Message };
