export interface NotificationMessage {
  to: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface NotificationProvider {
  sendMessage(message: NotificationMessage): Promise<{ id: string; status: string; rawResponse: any }>;
  getStatus(messageId: string): Promise<string>;
}
