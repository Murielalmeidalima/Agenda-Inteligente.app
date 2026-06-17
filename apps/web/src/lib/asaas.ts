/**
 * Utilitário de Integração com a API do Asaas.
 * https://docs.asaas.com/
 */

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''; // Configurar no .env.local

export interface AsaasCustomer {
  name: string;
  cpfCnpj?: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasSubscription {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

const headers = {
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY
};

export const AsaasService = {
  /**
   * Cria um cliente no Asaas.
   */
  async createCustomer(data: AsaasCustomer) {
    if (!ASAAS_API_KEY) {
      console.warn('[Asaas] API Key ausente. MOCK MODE ATIVADO.');
      return { id: 'cus_mock_' + Date.now() };
    }

    try {
      const response = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Asaas] Erro ao criar customer:', errorData);
        throw new Error(`Asaas Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Asaas] Exceção em createCustomer:', error);
      throw error;
    }
  },

  /**
   * Cria uma assinatura recorrente no Asaas.
   */
  async createSubscription(data: AsaasSubscription) {
    if (!ASAAS_API_KEY) {
      console.warn('[Asaas] API Key ausente. MOCK MODE ATIVADO.');
      return { id: 'sub_mock_' + Date.now() };
    }

    try {
      const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Asaas] Erro ao criar assinatura:', errorData);
        throw new Error(`Asaas Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Asaas] Exceção em createSubscription:', error);
      throw error;
    }
  },

  /**
   * Gera um PIX para a assinatura ou cobrança.
   */
  async createPixQrCode(paymentId: string) {
    if (!ASAAS_API_KEY) return { encodedImage: '', payload: 'MOCK_PIX_PAYLOAD' };

    try {
      const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers
      });
      return await response.json();
    } catch (error) {
      console.error('[Asaas] Erro ao gerar PIX:', error);
      throw error;
    }
  },

  /**
   * Busca as cobranças atreladas a uma assinatura para resgatar a invoiceUrl (Link de checkout)
   */
  async getSubscriptionPayments(subscriptionId: string) {
    if (!ASAAS_API_KEY) return { data: [{ invoiceUrl: 'http://localhost:3000/mock-payment' }] };

    try {
      const response = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Asaas Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Asaas] Erro ao buscar pagamentos da assinatura:', error);
      throw error;
    }
  }
};
