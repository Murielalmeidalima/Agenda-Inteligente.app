import { NotificationMessage, NotificationProvider } from '../types';
import { EvolutionProvider } from './evolution-provider';

export class WhatsappService {
  private provider: EvolutionProvider; // Use EvolutionProvider directly so we can call specific methods

  constructor(instanceName?: string) {
    this.provider = new EvolutionProvider(instanceName);
  }

  setInstance(instanceName: string) {
    this.provider.setInstanceName(instanceName);
  }

  // --- Evolution Specific Methods ---
  async getStatus() {
    return this.provider.getConnectionState();
  }

  async connect() {
    return this.provider.connect();
  }

  async createInstance() {
    return this.provider.createInstance();
  }

  async logout() {
    return this.provider.logout();
  }
  // ----------------------------------

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

  async checkMessageStatus(messageId: string) {
    return this.provider.getStatus(messageId);
  }
}
