import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client moved inside handler

// Endpoint chamado ao tentar marcar como realizado
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { appointment_id } = await request.json();

    if (!appointment_id) return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 });

    // 1. Buscar Agendamento e Procedimento
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select(`
        *,
        procedures(requires_anamnese, anamnese_template_id)
      `)
      .eq('id', appointment_id)
      .single();

    if (appError || !appointment) throw new Error('Agendamento não encontrado');

    // 2. Se não exige anamnese, libera
    if (!appointment.procedures.requires_anamnese) {
        return NextResponse.json({ allow: true });
    }

    // 3. Se exige, verificar se há resposta válida
    const { data: response, error: respError } = await supabase
      .from('anamnese_responses')
      .select('status')
      .eq('appointment_id', appointment_id)
      .eq('template_id', appointment.procedures.anamnese_template_id)
      .maybeSingle();

    if (!response || (response.status !== 'completed_client' && response.status !== 'completed_internal')) {
        return NextResponse.json({ 
            allow: false, 
            message: 'Anamnese obrigatória pendente. O procedimento não pode ser finalizado.' 
        }, { status: 403 });
    }

    return NextResponse.json({ allow: true });

  } catch (error: any) {
    console.error('Anamnese Check Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
