import { NotificationMessage, NotificationProvider } from '../types';

export class EvolutionProvider implements NotificationProvider {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || '';
  }

  async sendMessage(message: NotificationMessage) {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      throw new Error('Evolution API credentials not configured');
    }

    try {
      const url = `${this.apiUrl}/message/sendText/${this.instanceName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          number: message.to,
          options: {
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text: message.content
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Evolution API Error');
      }

      return {
        id: data.key?.id || `evo_${Date.now()}`,
        status: data.status || 'sent', 
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[EVOLUTION PROVIDER] Error:', error.message);
      throw error;
    }
  }

  async getStatus(messageId: string): Promise<string> {
    return 'unknown'; 
  }
}
