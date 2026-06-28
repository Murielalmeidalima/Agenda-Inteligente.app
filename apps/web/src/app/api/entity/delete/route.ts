import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

type EntityType = 
  | 'client' 
  | 'procedure' 
  | 'appointment' 
  | 'product' 
  | 'transaction' 
  | 'financial_category' 
  | 'financial_account' 
  | 'employee' 
  | 'anamnese_template' 
  | 'automation_rule';

export async function POST(req: Request) {
  try {
    const userSupabase = createServerClient();
    const { data: { session }, error: sessionErr } = await userSupabase.auth.getSession();

    if (sessionErr || !session || !session.user || !session.access_token) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
    }

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Perfil ou empresa não encontrada.' }, { status: 400 });
    }

    const body = await req.json();
    const { entity, id } = body as { entity: EntityType; id: string };

    if (!entity || !id) {
      return NextResponse.json({ error: 'Entidade e ID são obrigatórios.' }, { status: 400 });
    }

    const companyId = profile.company_id;
    console.log(`[ENTITY_DELETE] Excluindo ${entity} (${id}) para empresa ${companyId} com token JWT...`);

    switch (entity) {
      case 'client':
        const { data: clientAppts } = await supabase
          .from('appointments')
          .select('id')
          .eq('client_id', id)
          .eq('company_id', companyId);

        const apptIds = (clientAppts || []).map(a => a.id);

        try { await supabase.from('reviews').delete().eq('client_id', id); } catch (_) {}
        try { await supabase.from('inventory_transactions').delete().eq('client_id', id).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('transactions').delete().eq('client_id', id).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('anamnese_responses').delete().eq('client_id', id).eq('company_id', companyId); } catch (_) {}

        if (apptIds.length > 0) {
          try { await supabase.from('reviews').delete().in('appointment_id', apptIds); } catch (_) {}
          try { await supabase.from('inventory_transactions').delete().in('appointment_id', apptIds).eq('company_id', companyId); } catch (_) {}
          try { await supabase.from('transactions').delete().in('appointment_id', apptIds).eq('company_id', companyId); } catch (_) {}
          try { await supabase.from('anamnese_responses').delete().in('appointment_id', apptIds).eq('company_id', companyId); } catch (_) {}
          try {
            await supabase.from('appointments').update({ parent_appointment_id: null }).in('id', apptIds).eq('company_id', companyId);
            await supabase.from('appointments').update({ parent_appointment_id: null }).in('parent_appointment_id', apptIds).eq('company_id', companyId);
          } catch (_) {}
        }

        await supabase.from('appointments').delete().eq('client_id', id).eq('company_id', companyId);
        
        const { error: clientErr } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (clientErr) throw clientErr;
        break;

      case 'procedure':
        await supabase.from('transactions').update({ procedure_id: null }).eq('procedure_id', id).eq('company_id', companyId);
        
        const { data: procAppts } = await supabase
          .from('appointments')
          .select('id')
          .eq('procedure_id', id)
          .eq('company_id', companyId);

        const pApptIds = (procAppts || []).map(a => a.id);
        if (pApptIds.length > 0) {
          try { await supabase.from('transactions').delete().in('appointment_id', pApptIds).eq('company_id', companyId); } catch (_) {}
          try { await supabase.from('inventory_transactions').delete().in('appointment_id', pApptIds).eq('company_id', companyId); } catch (_) {}
        }

        await supabase.from('appointments').delete().eq('procedure_id', id).eq('company_id', companyId);

        const { error: procErr } = await supabase
          .from('procedures')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (procErr) throw procErr;
        break;

      case 'appointment':
        try { await supabase.from('transactions').delete().eq('appointment_id', id).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('inventory_transactions').delete().eq('appointment_id', id).eq('company_id', companyId); } catch (_) {}
        try { await supabase.from('anamnese_responses').delete().eq('appointment_id', id).eq('company_id', companyId); } catch (_) {}

        const { error: appErr } = await supabase
          .from('appointments')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (appErr) throw appErr;
        break;

      case 'product':
        await supabase.from('inventory_transactions').delete().eq('product_id', id).eq('company_id', companyId);

        const { error: prodErr } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (prodErr) throw prodErr;
        break;

      case 'transaction':
        const { error: transErr } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (transErr) throw transErr;
        break;

      case 'financial_category':
        await supabase.from('transactions').update({ category_id: null }).eq('category_id', id).eq('company_id', companyId);

        const { error: catErr } = await supabase
          .from('financial_categories')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (catErr) throw catErr;
        break;

      case 'financial_account':
        await supabase.from('transactions').update({ account_id: null }).eq('account_id', id).eq('company_id', companyId);

        const { error: accErr } = await supabase
          .from('financial_accounts')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (accErr) throw accErr;
        break;

      case 'employee':
        await supabase.from('appointments').update({ professional_id: session.user.id }).eq('professional_id', id).eq('company_id', companyId);

        const { error: empErr } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (empErr) throw empErr;
        break;

      case 'anamnese_template':
        const { error: tmplErr } = await supabase
          .from('anamnese_templates')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (tmplErr) throw tmplErr;
        break;

      case 'automation_rule':
        const { error: autoErr } = await supabase
          .from('automation_rules')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (autoErr) throw autoErr;
        break;

      default:
        return NextResponse.json({ error: 'Entidade desconhecida.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Registro excluído com sucesso.' });
  } catch (err: any) {
    console.error('[ENTITY_DELETE] Erro final:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir registro.' }, { status: 500 });
  }
}
