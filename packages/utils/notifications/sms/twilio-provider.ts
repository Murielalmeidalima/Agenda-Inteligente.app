import { NotificationMessage, NotificationProvider } from '../types';

export class TwilioProvider implements NotificationProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async sendMessage(message: NotificationMessage) {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', message.to);
      params.append('From', this.fromNumber);
      params.append('Body', message.content);

      if (process.env.TWILIO_STATUS_CALLBACK_URL) {
        params.append('StatusCallback', process.env.TWILIO_STATUS_CALLBACK_URL);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Twilio API Error');
      }

      return {
        id: data.sid,
        status: data.status,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[TWILIO PROVIDER] Error:', error.message);
      throw error;
    }
  }

  async getStatus(messageId: string): Promise<string> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${messageId}.json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      return data.status;
    } catch (error: any) {
      console.error('[TWILIO PROVIDER] Status Error:', error.message);
      return 'unknown';
    }
  }
}
