import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAnamnesePublicSchema, submitAnamneseSchema } from '@/lib/validations/anamnese';
import { logger } from '@/lib/logger';
import { rateLimit, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

// Server-side client com Service Role para ignorar RLS na validação do token público
export async function GET(request: NextRequest) {
  // Rate limiting: More lenient for public access
  const rateLimitResult = rateLimit(request, RATE_LIMITS.MODERATE);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { 
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  // Validate input
  const validation = getAnamnesePublicSchema.safeParse({ token });
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Token inválido', details: validation.error.format() },
      { status: 400 }
    );
  }

  try {
    logger.debug('Fetching anamnese form');
    
    // 1. Validar Token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('anamnese_tokens')
      .select('*, companies(name, logo_url), anamnese_responses(*)')
      .eq('token', validation.data.token)
      .single();

    if (tokenError || !tokenData) {
      logger.warn('Invalid or not found anamnese token');
      return NextResponse.json({ error: 'Token inválido ou não encontrado' }, { status: 404 });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      logger.warn('Expired anamnese token');
      return NextResponse.json({ error: 'Este link expirou. Solicite um novo.' }, { status: 410 });
    }

    if (tokenData.used_at) {
      logger.warn('Already used anamnese token');
      return NextResponse.json({ error: 'Esta anamnese já foi respondida.' }, { status: 409 });
    }

    // 2. Buscar Template e Perguntas
    const templateId = tokenData.anamnese_responses.template_id;
    
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('anamnese_templates')
      .select('*, anamnese_questions(*)')
      .eq('id', templateId)
      .single();

    if (templateError) {
       return NextResponse.json({ error: 'Modelo de anamnese não encontrado' }, { status: 404 }); 
    }

    // Retorna dados seguros para o frontend (sem expor IDs internos desnecessários)
    return NextResponse.json(
      {
        company: {
          name: tokenData.companies?.name,
          logo: tokenData.companies?.logo_url
        },
        template: {
          title: templateData.name,
          description: templateData.description,
          externalFormUrl: templateData.external_form_url,
          questions: templateData.anamnese_questions.sort((a: any, b: any) => a.order - b.order)
        },
        responseId: tokenData.response_id
      },
      { headers: createRateLimitHeaders(rateLimitResult) }
    );

  } catch (error) {
    logger.error('Anamnese public API error', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting: Strict for submissions
  const rateLimitResult = rateLimit(request, RATE_LIMITS.STRICT);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { 
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const body = await request.json();
    
    // Validate input
    const validation = submitAnamneseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { token, answers, consentAccepted, signatureDataUrl } = validation.data;
    // 1. Re-validar Token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('anamnese_tokens')
      .select('id, response_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      logger.warn('Invalid token on anamnese submission');
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      logger.warn('Expired token on anamnese submission');
      return NextResponse.json({ error: 'Expirado' }, { status: 410 });
    }
    if (tokenData.used_at) {
      logger.warn('Already used token on anamnese submission');
      return NextResponse.json({ error: 'Já respondido' }, { status: 409 });
    }

    // 2. Salvar Respostas
    const answersToInsert = Object.entries(answers).map(([qId, val]) => ({
      response_id: tokenData.response_id,
      question_id: qId,
      answer_value: val
    }));

    const { error: insertError } = await supabaseAdmin
      .from('anamnese_answers')
      .insert(answersToInsert);

    if (insertError) throw insertError;

    // 3. Atualizar Status e Token e salvar LGPD/Assinatura
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let uploadedSignatureUrl = null;
    let signatureHash = null;

    if (signatureDataUrl) {
      const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `signature_${tokenData.response_id}_${Date.now()}.png`;

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('anamnese_documents')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin
          .storage
          .from('anamnese_documents')
          .getPublicUrl(fileName);
        uploadedSignatureUrl = publicUrlData.publicUrl;
        
        signatureHash = crypto.createHash('sha256').update(signatureDataUrl + tokenData.response_id + Date.now().toString()).digest('hex');
      } else {
        logger.error('Failed to upload signature', uploadError);
      }
    }

    await supabaseAdmin.from('anamnese_responses')
      .update({ 
        status: 'completed_client', 
        completed_at: new Date().toISOString(),
        ip_address: clientIp,
        consent_accepted: consentAccepted,
        consent_text: 'Declaro que as informações acima são verdadeiras. Autorizo a clínica a utilizar estes dados estritamente para fins de avaliação e acompanhamento clínico, em conformidade com a Lei Geral de Proteção de Dados (LGPD).',
        consent_timestamp: new Date().toISOString(),
        consent_ip: clientIp,
        consent_user_agent: userAgent,
        signature_image_url: uploadedSignatureUrl,
        signature_hash: signatureHash,
        signature_timestamp: uploadedSignatureUrl ? new Date().toISOString() : null
      })
      .eq('id', tokenData.response_id);

    await supabaseAdmin.from('anamnese_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    logger.audit('Anamnese submitted successfully', {
      response_id: tokenData.response_id,
      answers_count: Object.keys(answers).length,
    });

    return NextResponse.json(
      { success: true },
      { headers: createRateLimitHeaders(rateLimitResult) }
    );

  } catch (error) {
    logger.error('Anamnese save error', error);
    return NextResponse.json({ error: 'Falha ao salvar respostas' }, { status: 500 });
  }
}
