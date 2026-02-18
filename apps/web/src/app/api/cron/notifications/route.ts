import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client (Bypassing RLS for Cron Jobs)
// Client initialization moved to handler

export const dynamic = 'force-dynamic'; // Ensure it runs dynamically

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // 1. Security Check (Optional: Add API Key header check here)
  /*
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  */

  try {
    const now = new Date();
    const results = {
      birthdays: 0,
      reminders: 0,
      reviews: 0,
      errors: [] as string[]
    };

    // --- A. BIRTHDAY TRIGGERS ---
    const { data: birthdayRules } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'birthday');

    if (birthdayRules?.length) {
      // Find clients with birthday today
      // Note: This is simplified. In prod, careful with Timezones and Leap Years.
      const todayMMDD = now.toISOString().slice(5, 10); // "MM-DD"
      
      const { data: birthdayClients } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active'); // Assuming there's a status

      // Filter in memory for simplicity in this MVP (SQL 'to_char' better for large scale)
      const celebrants = birthdayClients?.filter(c => 
        c.birth_date && c.birth_date.endsWith(todayMMDD)
      ) || [];

      for (const rule of birthdayRules) {
        for (const client of celebrants) {
          if (client.company_id !== rule.company_id) continue;

          // Check if already sent today
          const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('rule_id', rule.id)
            .eq('client_id', client.id)
            .gte('created_at', startOfDay);

          if (count === 0) {
            // Queue Notification
            const message = rule.message_template.replace('{cliente}', client.full_name.split(' ')[0]);
            await supabase.from('notifications').insert({
              company_id: rule.company_id,
              client_id: client.id,
              rule_id: rule.id,
              destination: client.phone,
              message_content: message,
              status: 'pending', // Logic to send immediately or later
              scheduled_for: new Date().toISOString()
            });
            results.birthdays++;
          }
        }
      }
    }

    // --- B. PRE-APPOINTMENT (Reminders) ---
    // Example: 24h before (time_offset -1440)
    // We look for appointments starting between [TargetTime - 15min] and [TargetTime + 15min]
    const { data: reminderRules } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'pre_appointment');

    if (reminderRules?.length) {
      for (const rule of reminderRules) {
        // Calculate target window
        // Rule: -1440 min (24h before). If Now is 10:00, we want appointments tomorrow at 10:00.
        // Appointment Time = Now + Abs(offset)
        const offsetMinutes = Math.abs(rule.time_offset_minutes);
        const targetTimeStart = new Date(now.getTime() + (offsetMinutes * 60000) - (15 * 60000)); // -15 min tolerance
        const targetTimeEnd = new Date(now.getTime() + (offsetMinutes * 60000) + (15 * 60000));   // +15 min tolerance

        const { data: appointments } = await supabase
          .from('appointments')
          .select('*, clients(full_name, phone), profiles(full_name)')
          .eq('status', 'confirmed')
          .eq('company_id', rule.company_id)
          .gte('start_time', targetTimeStart.toISOString())
          .lte('start_time', targetTimeEnd.toISOString());

        if (appointments) {
          for (const appt of appointments) {
            // Check duplicates
             const { count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('rule_id', rule.id)
              .eq('appointment_id', appt.id);
            
            if (count === 0) {
              let message = rule.message_template
                .replace('{cliente}', appt.clients?.full_name.split(' ')[0] || 'Cliente')
                .replace('{profissional}', appt.profiles?.full_name.split(' ')[0] || 'Profissional')
                .replace('{hora}', new Date(appt.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));

              await supabase.from('notifications').insert({
                company_id: rule.company_id,
                client_id: appt.client_id,
                appointment_id: appt.id,
                rule_id: rule.id,
                destination: appt.clients?.phone || '',
                message_content: message,
                status: 'pending',
                scheduled_for: new Date().toISOString()
              });
              results.reminders++;
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
