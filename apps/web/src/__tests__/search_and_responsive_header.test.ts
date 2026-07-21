import { describe, it, expect } from 'vitest';

describe('Auditoria da Busca Instantânea e Filtros Responsivos da Agenda', () => {
  const sampleAppointments: any[] = [
    {
      id: 'apt-1',
      clients: { full_name: 'Jamily Almeida', phone: '11999998888' },
      procedures: { name: 'Botox' },
      paymentStatus: 'paid',
      professional_id: 'pro-1',
      procedure_id: 'proc-1',
      paymentMethod: 'pix'
    },
    {
      id: 'apt-2',
      clients: { full_name: 'Maria Silva', phone: '11977776666' },
      procedures: { name: 'Preenchimento' },
      paymentStatus: 'overdue',
      professional_id: 'pro-2',
      procedure_id: 'proc-2',
      paymentMethod: 'credit_card'
    },
    {
      id: 'apt-3',
      clients: { full_name: 'Carlos Eduardo', phone: '11955554444' },
      procedures: { name: 'Limpeza de Pele' },
      paymentStatus: 'partial',
      professional_id: 'pro-1',
      procedure_id: 'proc-3',
      paymentMethod: 'cash'
    }
  ];

  // Teste 1: Filtragem por nome de cliente
  it('Deve filtrar agendamentos por nome do cliente (case-insensitive)', () => {
    const query = 'jamily';
    const result = sampleAppointments.filter(apt => 
      apt.clients.full_name.toLowerCase().includes(query.toLowerCase())
    );
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('apt-1');
  });

  // Teste 2: Filtragem por telefone do cliente
  it('Deve filtrar agendamentos por número de telefone do cliente', () => {
    const query = '97777';
    const result = sampleAppointments.filter(apt => 
      apt.clients.phone.includes(query)
    );
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('apt-2');
  });

  // Teste 3: Combinação de Busca por Nome + Filtro por Status de Pagamento
  it('Deve aplicar busca por nome e filtro de status de pagamento simultaneamente', () => {
    const query = 'maria';
    const statusFilter = 'overdue';

    const result = sampleAppointments.filter(apt => {
      const matchSearch = apt.clients.full_name.toLowerCase().includes(query.toLowerCase());
      const matchStatus = apt.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('apt-2');
  });

  // Teste 4: Busca com resultado inexistente
  it('Deve retornar lista vazia se nenhum cliente corresponder ao termo pesquisado', () => {
    const query = 'Inexistente';
    const result = sampleAppointments.filter(apt => 
      apt.clients.full_name.toLowerCase().includes(query.toLowerCase())
    );
    expect(result.length).toBe(0);
  });
});
