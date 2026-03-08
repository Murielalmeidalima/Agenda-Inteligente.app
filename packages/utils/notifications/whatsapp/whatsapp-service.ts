import { NotificationMessage, NotificationProvider } from '../types';
import { EvolutionProvider } from './evolution-provider';

export class WhatsappService {
  private provider: NotificationProvider;

  constructor(providerName: string = 'evolution') {
    if (providerName === 'evolution') {
      this.provider = new EvolutionProvider();
    } else {
      this.provider = new EvolutionProvider();
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55') && cleaned.length >= 10 && cleaned.length <= 11) {
      return `55${cleaned}`; 
    }
    return cleaned;
  }

  async send(params: { to: string; content: string; metadata?: any }) {
    const formattedTo = this.formatPhoneNumber(params.to);
    
    return this.provider.sendMessage({
      to: formattedTo,
      content: params.content,
      metadata: params.metadata
    });
  }

  async checkStatus(messageId: string) {
    return this.provider.getStatus(messageId);
  }
}
