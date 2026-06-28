import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obter o perfil do usuário para saber qual empresa limpar
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Perfil ou clínica não encontrada.' }, { status: 400 });
    }

    const companyId = profile.company_id;
    console.log('[CLEAR_DATA] Limpando todos os dados fictícios da clínica:', companyId);

    // Deletar em ordem respeitando chaves estrangeiras
    await supabase.from('transactions').delete().eq('company_id', companyId);
    await supabase.from('appointments').delete().eq('company_id', companyId);
    await supabase.from('clients').delete().eq('company_id', companyId);
    await supabase.from('procedures').delete().eq('company_id', companyId);
    await supabase.from('products').delete().eq('company_id', companyId);

    return NextResponse.json({ success: true, message: 'Todos os dados da clínica foram limpos com sucesso!' });
  } catch (err: any) {
    console.error('[CLEAR_DATA] Erro:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
