import { NotificationMessage, NotificationProvider } from '../types';

export class EvolutionProvider implements NotificationProvider {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(instanceName?: string) {
    this.apiUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    // Use the specific instance if provided, otherwise fallback to default env var
    this.instanceName = instanceName || process.env.EVOLUTION_INSTANCE_NAME || '';
  }

  setInstanceName(instanceName: string) {
    this.instanceName = instanceName;
  }

  private checkConfig() {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      throw new Error('Evolution API credentials or instance not configured');
    }
  }

  async createInstance(): Promise<any> {
    this.checkConfig();
    try {
      const response = await fetch(`${this.apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          instanceName: this.instanceName,
          token: this.instanceName, // using instanceName as token for simplicity
          qrcode: true
        }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('[EVOLUTION PROVIDER] Error creating instance:', error.message);
      throw error;
    }
  }

  async getConnectionState(): Promise<any> {
    this.checkConfig();
    try {
      const response = await fetch(`${this.apiUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        }
      });
      return await response.json();
    } catch (error: any) {
      console.error('[EVOLUTION PROVIDER] Error getting connection state:', error.message);
      throw error;
    }
  }

  async connect(): Promise<any> {
    this.checkConfig();
    try {
      const response = await fetch(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        }
      });
      return await response.json(); // This will contain the base64 QR code if not connected
    } catch (error: any) {
      console.error('[EVOLUTION PROVIDER] Error connecting instance:', error.message);
      throw error;
    }
  }

  async logout(): Promise<any> {
    this.checkConfig();
    try {
      const response = await fetch(`${this.apiUrl}/instance/logout/${this.instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.apiKey,
        }
      });
      return await response.json();
    } catch (error: any) {
      console.error('[EVOLUTION PROVIDER] Error logging out instance:', error.message);
      throw error;
    }
  }

  async sendMessage(message: NotificationMessage) {
    this.checkConfig();

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
