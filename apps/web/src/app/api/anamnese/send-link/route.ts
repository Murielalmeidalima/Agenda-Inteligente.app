import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAnamneseLinkSchema } from '@/lib/validations/anamnese';
import { logger } from '@/lib/logger';
import { rateLimit, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

// Este endpoint seria chamado pelo seu sistema ao criar um agendamento, 
// ou por um CRON job, para disparar o link.
// Exemplo de payload esperado: { "appointment_id": "uuid" }
export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per hour
  const rateLimitResult = rateLimit(request, RATE_LIMITS.STANDARD);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { 
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const body = await request.json();
    
    // Validate input
    const validation = sendAnamneseLinkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { appointment_id } = validation.data;
    // 1. Buscar dados do agendamento e verificar se exige anamnese
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select(`
        *,
        procedures(name, requires_anamnese, anamnese_template_id),
        clients(full_name, phone),
        companies(name)
      `)
      .eq('id', appointment_id)
      .single();

    if (appError || !appointment) throw new Error('Agendamento não encontrado');

    if (!appointment.procedures.requires_anamnese || !appointment.procedures.anamnese_template_id) {
        return NextResponse.json({ message: 'Anamnese não exigida para este procedimento' });
    }

    // 2. Verificar se já existe resposta ou token válido
    const { data: existingResponse } = await supabase
       .from('anamnese_responses')
       .select('id, status')
       .eq('appointment_id', appointment.id)
       .maybeSingle();

    if (existingResponse?.status === 'completed_client' || existingResponse?.status === 'completed_internal') {
        return NextResponse.json({ message: 'Anamnese já respondida' });
    }

    let responseId = existingResponse?.id;

    // 3. Criar Response se não existir
    if (!responseId) {
       const { data: newResponse, error: createError } = await supabase
         .from('anamnese_responses')
         .insert({
            company_id: appointment.company_id,
            client_id: appointment.client_id,
            appointment_id: appointment.id,
            template_id: appointment.procedures.anamnese_template_id,
            status: 'pending'
         })
         .select()
         .single();
       
       if (createError) throw createError;
       responseId = newResponse.id;
    }

    // 4. Gerar e Salvar Token (Hash simples para demo, ideal usar crypto)
    // Usamos crypto.randomUUID() e salvamos
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48h validade

    const { error: tokenError } = await supabase
       .from('anamnese_tokens')
       .insert({
          company_id: appointment.company_id,
          response_id: responseId,
          token: token,
          expires_at: expiresAt.toISOString()
       });

    if (tokenError) throw tokenError;

    // 5. Enviar Link via Email (Futuramente)
    // Por enquanto, apenas retornamos o link para ser usado pelo frontend se necessário
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/f/${token}`;
    
    logger.audit('Anamnese link generated', { 
      appointment_id,
      client_name: appointment.clients?.full_name,
    });

    return NextResponse.json(
      { success: true, link },
      { headers: createRateLimitHeaders(rateLimitResult) }
    );

  } catch (error: any) {
    logger.error('Anamnese link generation failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
