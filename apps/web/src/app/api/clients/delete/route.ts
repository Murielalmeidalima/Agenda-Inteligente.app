import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const userSupabase = createServerClient();
    const { data: { session }, error: sessionErr } = await userSupabase.auth.getSession();

    if (sessionErr || !session || !session.user || !session.access_token) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada. Faça login novamente.' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, confirmCancelFuture } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    // Cliente Supabase autenticado via Bearer Token do usuário (RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      }
    );

    // Obter empresa e perfil do usuário autenticado
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role, full_name')
      .eq('id', session.user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Perfil ou empresa não encontrada.' }, { status: 400 });
    }

    const companyId = profile.company_id;

    // 1. VERIFICAÇÃO NO BANCO: Confirmar se o registro existe
    const { data: targetClient, error: clientFetchErr } = await supabase
      .from('clients')
      .select('id, full_name, phone, email')
      .eq('id', clientId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (clientFetchErr) {
      console.error('[CLIENT_DELETE] Erro ao buscar cliente:', clientFetchErr);
      throw clientFetchErr;
    }

    // Se o cliente não existir no banco por este ID, buscar se existe outro com o mesmo nome exato na empresa
    if (!targetClient) {
      console.log(`[CLIENT_DELETE] Cliente ID ${clientId} não encontrado diretamente. Verificando duplicados por empresa...`);
    }

    // Buscar TODOS os registros correspondentes ao cliente (mesmo ID ou mesmo nome/e-mail para eliminar duplicados de uma só vez)
    let matchingClients: any[] = [];
    if (targetClient) {
      const { data: matches } = await supabase
        .from('clients')
        .select('id, full_name, phone, email')
        .eq('company_id', companyId)
        .eq('full_name', targetClient.full_name);
      matchingClients = matches && matches.length > 0 ? matches : [targetClient];
    } else {
      return NextResponse.json({ 
        success: true, 
        alreadyDeleted: true, 
        message: 'Registro não encontrado no banco de dados. A interface foi atualizada.' 
      });
    }

    const clientIds = matchingClients.map(c => c.id);
    const clientName = targetClient.full_name;
    const nowIso = new Date().toISOString();

    console.log(`[CLIENT_DELETE] Processando exclusão para '${clientName}' (IDs encontrados: ${clientIds.join(', ')})...`);

    // 2. Buscar agendamentos futuros ativos vinculados a QUALQUER um dos IDs deste cliente
    const { data: futureAppointments } = await supabase
      .from('appointments')
      .select('id, start_time, status, notes')
      .in('client_id', clientIds)
      .eq('company_id', companyId)
      .gte('start_time', nowIso)
      .not('status', 'in', '("cancelled","completed")');

    const futureApptsCount = futureAppointments?.length || 0;

    // CENÁRIO 2: Cliente possui agendamentos futuros e confirmação ainda não foi enviada
    if (futureApptsCount > 0 && !confirmCancelFuture) {
      return NextResponse.json({
        requiresConfirmation: true,
        futureAppointmentsCount: futureApptsCount,
        clientName: clientName,
        message: 'Este cliente possui agendamentos futuros. Deseja realmente cancelar os agendamentos e excluir o cliente?'
      });
    }

    let cancelledCount = 0;

    // Se possui agendamentos futuros e confirmação foi concedida, cancelar todos os agendamentos futuros
    if (futureApptsCount > 0 && confirmCancelFuture) {
      for (const appt of futureAppointments!) {
        const updatedNotes = appt.notes ? `${appt.notes} [Cliente removido.]` : '[Cliente removido.]';
        await supabase
          .from('appointments')
          .update({ 
            status: 'cancelled', 
            notes: updatedNotes 
          })
          .eq('id', appt.id)
          .eq('company_id', companyId);
      }
      cancelledCount = futureApptsCount;
      console.log(`[CLIENT_DELETE] ${cancelledCount} agendamentos futuros cancelados com motivo 'Cliente removido.'`);
    }

    // 3. Checar histórico passado/financeiro (CENÁRIO 3 vs CENÁRIO 1/2)
    const { data: pastAppointments } = await supabase
      .from('appointments')
      .select('id')
      .in('client_id', clientIds)
      .eq('company_id', companyId)
      .or(`start_time.lt.${nowIso},status.in.("completed","confirmed")`);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .in('client_id', clientIds)
      .eq('company_id', companyId);

    const hasPastHistory = (pastAppointments && pastAppointments.length > 0) || (transactions && transactions.length > 0);

    // Buscar todos os agendamentos vinculados aos IDs do cliente
    const { data: allClientAppts } = await supabase
      .from('appointments')
      .select('id')
      .in('client_id', clientIds)
      .eq('company_id', companyId);

    const allApptIds = (allClientAppts || []).map(a => a.id);

    if (hasPastHistory) {
      // CENÁRIO 3: Cliente possui histórico passado/financeiro.
      // NÃO apagar histórico financeiro ou procedimentos! Apenas remover o vínculo direto (definir client_id = NULL).
      console.log(`[CLIENT_DELETE] Cliente '${clientName}' possui histórico passado/financeiro. Preservando histórico e desvinculando...`);

      try { await supabase.from('transactions').update({ client_id: null }).in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}
      try { await supabase.from('inventory_transactions').update({ client_id: null }).in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}
      try { await supabase.from('reviews').update({ client_id: null }).in('client_id', clientIds); } catch (_) {}
      try { await supabase.from('anamnese_responses').update({ client_id: null }).in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}

      // Desvincular agendamentos
      try {
        await supabase.from('appointments').update({ client_id: null }).in('client_id', clientIds).eq('company_id', companyId);
      } catch (err) {
        console.log('[CLIENT_DELETE] client_id em appointments possui restrição.');
      }
    } else {
      // CENÁRIO 1 e 2 (sem histórico passado): Limpeza de registros sem histórico contábil
      console.log(`[CLIENT_DELETE] Cliente '${clientName}' sem histórico passado. Executando exclusão completa de dependências...`);
      try { await supabase.from('reviews').delete().in('client_id', clientIds); } catch (_) {}
      try { await supabase.from('inventory_transactions').delete().in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}
      try { await supabase.from('transactions').delete().in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}
      try { await supabase.from('anamnese_responses').delete().in('client_id', clientIds).eq('company_id', companyId); } catch (_) {}

      if (allApptIds.length > 0) {
        try { await supabase.from('reviews').delete().in('appointment_id', allApptIds); } catch (_) {}
        try { await supabase.from('inventory_transactions').delete().in('appointment_id', allApptIds).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('transactions').delete().in('appointment_id', allApptIds).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('anamnese_responses').delete().in('appointment_id', allApptIds).eq('company_id', companyId); } catch (_) {}
        try {
          await supabase.from('appointments').update({ parent_appointment_id: null }).in('id', allApptIds).eq('company_id', companyId);
          await supabase.from('appointments').update({ parent_appointment_id: null }).in('parent_appointment_id', allApptIds).eq('company_id', companyId);
        } catch (_) {}
      }
      await supabase.from('appointments').delete().in('client_id', clientIds).eq('company_id', companyId);
    }

    // 4. EXCLUIR TODOS OS REGISTROS CORRESPONDENTES DO CLIENTE NO BANCO DE DADOS
    const { error: deleteErr } = await supabase
      .from('clients')
      .delete()
      .in('id', clientIds)
      .eq('company_id', companyId);

    if (deleteErr) {
      console.error('[CLIENT_DELETE] Erro ao deletar da tabela clients:', deleteErr);
      try {
        await supabase.from('appointments').update({ client_id: null }).in('client_id', clientIds).eq('company_id', companyId);
      } catch (_) {}
      const { error: retryErr } = await supabase.from('clients').delete().in('id', clientIds).eq('company_id', companyId);
      if (retryErr) throw retryErr;
    }

    // 5. REGISTRAR LOG DE AUDITORIA
    try {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: session.user.id,
        action: 'DELETE_CLIENT',
        details: {
          client_ids: clientIds,
          client_name: clientName,
          deleted_by_name: profile.full_name,
          cancelled_future_appointments: cancelledCount,
          preserved_history: hasPastHistory,
          timestamp: new Date().toISOString()
        }
      });
    } catch (auditErr) {
      console.log('[CLIENT_DELETE] Log de auditoria:', auditErr);
    }

    console.log(`[CLIENT_DELETE] Cliente '${clientName}' (${clientIds.length} registro(s)) removido com sucesso.`);

    return NextResponse.json({
      success: true,
      clientName: clientName,
      cancelledAppointmentsCount: cancelledCount,
      message: 'Cliente removido com sucesso de todo o sistema.'
    });
  } catch (err: any) {
    console.error('[CLIENT_DELETE] Erro fatal na exclusão:', err.message || err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir cliente.' }, { status: 500 });
  }
}
