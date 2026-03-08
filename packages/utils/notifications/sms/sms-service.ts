import { NotificationMessage, NotificationProvider } from '../types';
import { TwilioProvider } from './twilio-provider';

export class SmsService {
  private provider: NotificationProvider;

  constructor(providerName: string = 'twilio') {
    if (providerName === 'twilio') {
      this.provider = new TwilioProvider();
    } else {
      this.provider = new TwilioProvider();
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55') && cleaned.length >= 10 && cleaned.length <= 11) {
      return `+55${cleaned}`;
    }
    if (cleaned.startsWith('55')) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
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
