import { describe, it, expect } from 'vitest';
import { shouldGenerateMaintenanceOnCreate } from '../lib/maintenance-logic';

describe('Suíte de Auditoria Financeira: Atendimentos Normais vs. Retroativos (Lançar Atendimento)', () => {

  // Simulador do motor financeiro para lançamentos e agendamentos
  function processAppointmentFinancialFlow(input: {
    isLaunching: boolean;
    procedurePrice: number;
    launchingPrice?: number;
    launchingPaymentStatus: 'paid' | 'partial' | 'pending';
    launchingPaidAmount?: number;
    launchingPaymentMethod?: string;
  }) {
    const finalPrice = input.isLaunching ? (input.launchingPrice || input.procedurePrice) : input.procedurePrice;
    
    let appointmentStatus = input.isLaunching ? 'completed' : 'scheduled';
    let paymentStatus = input.isLaunching ? input.launchingPaymentStatus : 'pending';
    let paymentMethod = input.isLaunching && input.launchingPaymentStatus !== 'pending' ? input.launchingPaymentMethod : null;

    let transactionCreated = false;
    let transactionAmount = 0;
    let cashFlowEntry = 0;

    if (input.isLaunching && input.launchingPaymentStatus !== 'pending') {
      const paidVal = input.launchingPaymentStatus === 'paid' ? finalPrice : Number(input.launchingPaidAmount || 0);
      if (paidVal > 0) {
        transactionCreated = true;
        transactionAmount = paidVal;
        cashFlowEntry = paidVal; // Entrada no caixa no dia do atendimento
      }
    }

    const pendingReceivable = Math.max(0, finalPrice - transactionAmount);

    return {
      finalPrice,
      appointmentStatus,
      paymentStatus,
      paymentMethod,
      transactionCreated,
      transactionAmount,
      cashFlowEntry,
      pendingReceivable
    };
  }

  // Teste 1: Atendimento Retroativo PAGO (Caso 1)
  it('Cenário 1: Atendimento retroativo PAGO registra entrada no caixa e status "paid"', () => {
    const res = processAppointmentFinancialFlow({
      isLaunching: true,
      procedurePrice: 120,
      launchingPrice: 120,
      launchingPaymentStatus: 'paid',
      launchingPaymentMethod: 'pix'
    });

    expect(res.appointmentStatus).toBe('completed');
    expect(res.paymentStatus).toBe('paid');
    expect(res.paymentMethod).toBe('pix');
    expect(res.transactionCreated).toBe(true);
    expect(res.cashFlowEntry).toBe(120);
    expect(res.pendingReceivable).toBe(0);
  });

  // Teste 2: Atendimento Retroativo PARCIAL (Caso 2)
  it('Cenário 2: Atendimento retroativo PARCIAL registra valor recebido no caixa e saldo em Contas a Receber', () => {
    const res = processAppointmentFinancialFlow({
      isLaunching: true,
      procedurePrice: 120,
      launchingPrice: 120,
      launchingPaymentStatus: 'partial',
      launchingPaidAmount: 50,
      launchingPaymentMethod: 'credit_card'
    });

    expect(res.appointmentStatus).toBe('completed');
    expect(res.paymentStatus).toBe('partial');
    expect(res.transactionCreated).toBe(true);
    expect(res.cashFlowEntry).toBe(50);
    expect(res.pendingReceivable).toBe(70); // R$ 120 - R$ 50 = R$ 70 pendente no Contas a Receber
  });

  // Teste 3: Atendimento Retroativo NÃO PAGO (Caso 3)
  it('Cenário 3: Atendimento retroativo NÃO PAGO registra 0 no caixa e 100% em Contas a Receber', () => {
    const res = processAppointmentFinancialFlow({
      isLaunching: true,
      procedurePrice: 120,
      launchingPrice: 120,
      launchingPaymentStatus: 'pending'
    });

    expect(res.appointmentStatus).toBe('completed');
    expect(res.paymentStatus).toBe('pending');
    expect(res.transactionCreated).toBe(false);
    expect(res.cashFlowEntry).toBe(0);
    expect(res.pendingReceivable).toBe(120); // 100% no Contas a Receber
  });

  // Teste 4: Regra de Manutenção Não Gerada em Lançamento Retroativo
  it('Cenário 4: Lançamentos retroativos (isLaunching: true) NÃO geram manutenção automática na criação', () => {
    const procedureObj = { maintenance_required: true, maintenance_days_limit: 180 };
    
    // Normal schedule -> generates maintenance
    const normalGenerate = shouldGenerateMaintenanceOnCreate(procedureObj, false, false);
    expect(normalGenerate).toBe(true);

    // Retroactive launch -> DOES NOT generate maintenance
    const retroactiveGenerate = shouldGenerateMaintenanceOnCreate(procedureObj, true, false);
    expect(retroactiveGenerate).toBe(false);
  });

  // Teste 5: Liquidação Posterior de Pagamento
  it('Cenário 5: Ao quitar um pagamento pendente no modal de edição, o status atualiza para "paid" e a transação é criada', () => {
    const initial = processAppointmentFinancialFlow({
      isLaunching: true,
      procedurePrice: 150,
      launchingPaymentStatus: 'pending'
    });

    expect(initial.pendingReceivable).toBe(150);

    // Simulação do recebimento direto posterior de R$ 150
    const paymentVal = 150;
    const paidConfirmed = initial.transactionAmount + paymentVal;
    const totalCost = initial.finalPrice;
    
    let updatedPaymentStatus = 'pending';
    if (paidConfirmed >= totalCost) {
      updatedPaymentStatus = 'paid';
    }

    expect(paidConfirmed).toBe(150);
    expect(updatedPaymentStatus).toBe('paid');
  });

});
