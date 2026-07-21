import { describe, it, expect } from 'vitest';

describe('Suíte de Testes: Valores Fixos de Agenda (1º Atendimento x Manutenção) e Desconto Manual Opcional', () => {

  // Helper de Cálculo de Preço (Espelhando a lógica refinada)
  function calculateAppointmentPricing(params: {
    procedure: { price: number; maintenance_price?: number | null };
    isMaintenance: boolean;
    discount?: {
      method: 'percentage' | 'value';
      value?: string;
      percentage?: string;
    } | null;
  }) {
    const originalBasePrice = Number(params.procedure.price || 0);
    let usedBasePrice = originalBasePrice;
    let priceType: 'normal' | 'maintenance' = 'normal';

    if (params.isMaintenance && params.procedure.maintenance_price && Number(params.procedure.maintenance_price) > 0) {
      usedBasePrice = Number(params.procedure.maintenance_price);
      priceType = 'maintenance';
    }

    let manualDiscountVal = 0;
    if (params.discount) {
      if (params.discount.method === 'value' && params.discount.value) {
        manualDiscountVal = parseFloat(params.discount.value.replace(',', '.')) || 0;
      } else if (params.discount.method === 'percentage' && params.discount.percentage) {
        const pct = parseFloat(params.discount.percentage.replace(',', '.')) || 0;
        manualDiscountVal = usedBasePrice * (pct / 100);
      }
    }

    const finalPrice = Math.max(0, usedBasePrice - manualDiscountVal);

    return {
      originalBasePrice,
      usedBasePrice,
      priceType,
      manualDiscountVal,
      finalPrice
    };
  }

  // Cenário 1: Primeiro Agendamento (Sempre Normal Fixo R$ 120,00)
  it('Cenário 1: 1º Agendamento criado manualmente é sempre normal fixo (R$ 120,00)', () => {
    const procedure = { price: 120, maintenance_price: 90 };
    const pricing = calculateAppointmentPricing({
      procedure,
      isMaintenance: false, // 1º agendamento sempre false
      discount: null
    });

    expect(pricing.originalBasePrice).toBe(120);
    expect(pricing.usedBasePrice).toBe(120);
    expect(pricing.priceType).toBe('normal');
    expect(pricing.manualDiscountVal).toBe(0);
    expect(pricing.finalPrice).toBe(120);
  });

  // Cenário 2: Agendamento de Manutenção (Gerado automaticamente ou is_maintenance: true)
  it('Cenário 2: Agendamento de manutenção futuro utiliza o valor fixo de manutenção (R$ 90,00)', () => {
    const procedure = { price: 120, maintenance_price: 90 };
    const pricing = calculateAppointmentPricing({
      procedure,
      isMaintenance: true, // Agendamento de manutenção gerado
      discount: null
    });

    expect(pricing.originalBasePrice).toBe(120);
    expect(pricing.usedBasePrice).toBe(90);
    expect(pricing.priceType).toBe('maintenance');
    expect(pricing.manualDiscountVal).toBe(0);
    expect(pricing.finalPrice).toBe(90);
  });

  // Cenário 3: Desconto Manual (10%) sobre 1º Agendamento Normal (R$ 120,00 -> R$ 108,00)
  it('Cenário 3: Desconto manual de 10% no 1º agendamento reduz valor para R$ 108,00', () => {
    const procedure = { price: 120, maintenance_price: 90 };
    const pricing = calculateAppointmentPricing({
      procedure,
      isMaintenance: false,
      discount: {
        method: 'percentage',
        percentage: '10'
      }
    });

    expect(pricing.usedBasePrice).toBe(120);
    expect(pricing.manualDiscountVal).toBe(12);
    expect(pricing.finalPrice).toBe(108);
  });

  // Cenário 4: Desconto Manual (R$ 10,00) sobre Manutenção (R$ 90,00 -> R$ 80,00)
  it('Cenário 4: Desconto manual de R$ 10,00 sobre o agendamento de manutenção (R$ 90,00) resulta em R$ 80,00', () => {
    const procedure = { price: 120, maintenance_price: 90 };
    const pricing = calculateAppointmentPricing({
      procedure,
      isMaintenance: true,
      discount: {
        method: 'value',
        value: '10'
      }
    });

    expect(pricing.usedBasePrice).toBe(90);
    expect(pricing.manualDiscountVal).toBe(10);
    expect(pricing.finalPrice).toBe(80);
  });

});
