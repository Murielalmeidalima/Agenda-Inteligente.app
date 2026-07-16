import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';

// Endpoint chamado ao tentar marcar como realizado
export async function POST(request: NextRequest) {
  const supabase = createServerClient();
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

    // 2. Se for manutenção ou não exige anamnese, libera
    if (appointment.is_maintenance) {
        return NextResponse.json({ allow: true });
    }

    const procedures = Array.isArray(appointment.procedures) ? appointment.procedures[0] : appointment.procedures;
    if (!procedures || !procedures.requires_anamnese) {
        return NextResponse.json({ allow: true });
    }

    // 3. Se exige, verificar se há resposta válida para este cliente no prazo
    const { data: latestResponse, error: respError } = await supabase
      .from('anamnese_responses')
      .select('status, created_at, anamnese_templates(validity_value, validity_unit)')
      .eq('client_id', appointment.client_id)
      .eq('template_id', procedures.anamnese_template_id)
      .in('status', ['completed_client', 'completed_internal'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (respError) throw respError;

    if (latestResponse) {
      const anamneseTemplates = latestResponse.anamnese_templates as any;
      const validityValue = anamneseTemplates?.validity_value ?? 6;
      const validityUnit = anamneseTemplates?.validity_unit ?? 'months';
      
      const createdAt = new Date(latestResponse.created_at);
      const expiresAt = new Date(createdAt.getTime());

      if (validityUnit === 'days') {
        expiresAt.setDate(expiresAt.getDate() + validityValue);
      } else if (validityUnit === 'years') {
        expiresAt.setFullYear(expiresAt.getFullYear() + validityValue);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + validityValue);
      }
      
      if (expiresAt > new Date()) {
        return NextResponse.json({ allow: true });
      }
    }

    return NextResponse.json({ 
        allow: false, 
        message: 'Anamnese obrigatória pendente ou expirada. O paciente precisa preencher a ficha novamente antes de concluir o atendimento.' 
    }, { status: 403 });

  } catch (error: any) {
    console.error('Anamnese Check Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
