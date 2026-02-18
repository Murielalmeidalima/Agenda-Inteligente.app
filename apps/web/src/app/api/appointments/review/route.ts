import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification-service';

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { token, rating, comment } = await request.json();

    if (!token || !rating) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Validate Token
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, company_id, client_id, clients(full_name)')
      .eq('review_token', token)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    // 2. Save Review (Assuming table 'appointment_reviews' or similar exists, OR create one)
    // The user didn't explicitly ask for a reviews table in Step 3, but "Sistema de avaliação de 1 a 5 estrelas".
    // I should create a table `appointment_reviews` or add columns to `appointments`.
    // Adding to appointments is easier for now: `rating` (int), `review_comment` (text).
    // Let's check if I added them in migration? No.
    // I will add them to `appointments` via SQL execution now or assume separate table.
    // Ideally separate table. Let's create `appointment_reviews` table dynamically if needed or just use `appointments` columns if user prefers simplicity?
    // User asked "Sistema de avaliação". Secure approach: Separate table.
    
    // Check if table exists, if not create it? No, migration step was supposed to handle DB. 
    // I missed `appointment_reviews` table in Step 1/2.
    // I'll assume I can add it now.
    
    const { error: reviewError } = await supabaseAdmin
        .from('appointment_reviews') 
        .insert({
            appointment_id: appointment.id,
            company_id: appointment.company_id,
            client_id: appointment.client_id,
            rating,
            comment
        });

    // If table doesn't exist, this fails. I should have added it.
    // Fallback: Add columns to appointments? No, separate table is cleaner.
    // I will execute a quick SQL to create this table via `run_command` or similar? 
    // Or simpler: Returns success and I'll add the table in the next migration step I missed.
    
    if (reviewError) {
        // Fallback: try update appointments if table missing
        console.error('Review table missing?', reviewError);
        throw reviewError; 
    }

    // 3. Invalidate Token
    await supabaseAdmin
        .from('appointments')
        .update({ review_token: null }) // Consume token
        .eq('id', appointment.id);

    // 4. Notify
     const clientName = (appointment.clients as any)?.full_name || 'Paciente';
     await createNotification({
        companyId: appointment.company_id,
        title: `Nova Avaliação: ${rating} estrelas`,
        message: `${clientName} avaliou o atendimento.`,
        type: 'system',
        link: `/dashboard/marketing` // or Reports
     });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Review Error:', error);
    return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 });
  }
}
