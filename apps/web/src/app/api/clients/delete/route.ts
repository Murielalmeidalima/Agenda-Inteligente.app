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
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    // Usar cliente Supabase autenticado via Bearer Token do usuário
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

    // Obter empresa do usuário autenticado para garantir isolamento por tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Perfil ou empresa não encontrada.' }, { status: 400 });
    }

    const companyId = profile.company_id;
    console.log(`[CLIENT_DELETE] Iniciando limpeza em cascata rigorosa para cliente ${clientId} (empresa ${companyId})...`);

    // Buscar IDs de todos os agendamentos vinculados ao cliente para limpar tabelas filhas dos agendamentos
    const { data: clientAppts } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', clientId)
      .eq('company_id', companyId);

    const apptIds = (clientAppts || []).map(a => a.id);

    // 1. Limpar avaliações / reviews
    try {
      await supabase.from('reviews').delete().eq('client_id', clientId);
      if (apptIds.length > 0) {
        await supabase.from('reviews').delete().in('appointment_id', apptIds);
      }
    } catch (_) {}

    // 2. Limpar movimentações de estoque vinculadas ao cliente ou seus agendamentos
    try {
      await supabase.from('inventory_transactions').delete().eq('client_id', clientId).eq('company_id', companyId);
      if (apptIds.length > 0) {
        await supabase.from('inventory_transactions').delete().in('appointment_id', apptIds).eq('company_id', companyId);
      }
    } catch (_) {}

    // 3. Limpar transações financeiras vinculadas ao cliente ou seus agendamentos
    try {
      await supabase.from('transactions').delete().eq('client_id', clientId).eq('company_id', companyId);
      if (apptIds.length > 0) {
        await supabase.from('transactions').delete().in('appointment_id', apptIds).eq('company_id', companyId);
      }
    } catch (_) {}

    // 4. Limpar respostas de anamnese vinculadas ao cliente ou seus agendamentos
    try {
      await supabase.from('anamnese_responses').delete().eq('client_id', clientId).eq('company_id', companyId);
      if (apptIds.length > 0) {
        await supabase.from('anamnese_responses').delete().in('appointment_id', apptIds).eq('company_id', companyId);
      }
    } catch (_) {}

    // 5. Desvincular agendamentos pai (parent_appointment_id) para evitar autoflag de FK
    if (apptIds.length > 0) {
      try {
        await supabase.from('appointments').update({ parent_appointment_id: null }).in('id', apptIds).eq('company_id', companyId);
        await supabase.from('appointments').update({ parent_appointment_id: null }).in('parent_appointment_id', apptIds).eq('company_id', companyId);
      } catch (_) {}
    }

    // 6. Excluir agendamentos do cliente
    await supabase.from('appointments').delete().eq('client_id', clientId).eq('company_id', companyId);

    // 7. Excluir o cliente permanentemente
    const { error: deleteErr, count } = await supabase
      .from('clients')
      .delete({ count: 'exact' })
      .eq('id', clientId)
      .eq('company_id', companyId);

    if (deleteErr) {
      console.error('[CLIENT_DELETE] Erro no Supabase:', deleteErr);
      throw deleteErr;
    }

    console.log(`[CLIENT_DELETE] Cliente excluído permanentemente. Linhas deletadas: ${count}`);

    return NextResponse.json({ success: true, count, message: 'Cliente e histórico excluídos permanentemente.' });
  } catch (err: any) {
    console.error('[CLIENT_DELETE] Erro final:', err.message || err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir cliente.' }, { status: 500 });
  }
}
