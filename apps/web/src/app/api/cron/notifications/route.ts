import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const results = {
      birthdays: 0,
      reminders: 0,
      post_appointments: 0,
      inactive_clients: 0,
      errors: [] as string[]
    };

    const { data: rulesData } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    // Evolution API / WhatsApp integration is disabled in MVP.
    // We filter out all rules to prevent enqueuing any automated WhatsApp messages.
    const rules = (rulesData || []).filter((r: any) => false);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma regra de automação ativa para processar no MVP (WhatsApp Desativado).' });
    }

    // 1. Definições de Timezone e Datas
    const nowUtc = new Date();
    // Offset fixo do Brasil (-3) para cálculos manuais seguros de target dates
    const saoPauloOffsetMinutes = -180;
    const nowBr = new Date(nowUtc.getTime() + (saoPauloOffsetMinutes * 60000));
    
    // Início do dia de hoje no BR (em UTC) para cálculos de "já enviado hoje"
    const startOfTodayBrUtc = new Date(Date.UTC(nowBr.getUTCFullYear(), nowBr.getUTCMonth(), nowBr.getUTCDate(), 3, 0, 0)); // 00:00 BR = 03:00 UTC
    
    // --- 2. PRE e POST APPOINTMENTS ---
    const apptRules = rules.filter(r => r.trigger_type === 'pre_appointment' || r.trigger_type === 'post_appointment');
    
    for (const rule of apptRules) {
      const offsetMinutes = rule.time_offset_minutes;
      
      const targetTimeStartBr = new Date(nowBr.getTime() - (offsetMinutes * 60000) - (15 * 60000)); 
      const targetTimeEndBr = new Date(nowBr.getTime() - (offsetMinutes * 60000) + (15 * 60000));
      
      const targetTimeStartUtc = new Date(targetTimeStartBr.getTime() - (saoPauloOffsetMinutes * 60000));
      const targetTimeEndUtc = new Date(targetTimeEndBr.getTime() - (saoPauloOffsetMinutes * 60000));

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_client_id_fkey(full_name, phone), procedures(name)')
        .eq('company_id', rule.company_id)
        .gte('start_time', targetTimeStartUtc.toISOString())
        .lte('start_time', targetTimeEndUtc.toISOString());

      if (appointments && appointments.length > 0) {
        for (const appt of (appointments || [])) {
          if (rule.trigger_type === 'pre_appointment' && appt.status === 'completed') continue;
          if (rule.trigger_type === 'post_appointment' && appt.status !== 'completed') continue;

          const clientData = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles;
          const clientPhone = clientData?.phone;
          if (!clientPhone) continue;

          const { count } = await supabase
            .from('automation_logs')
            .select('*', { count: 'exact', head: true })
            .eq('rule_id', rule.id)
            .eq('recipient_phone', clientPhone)
            .gte('sent_at', startOfTodayBrUtc.toISOString());
            
          if (count === 0) {
            let message = rule.message_template
              .replace('{cliente}', clientData.full_name?.split(' ')[0] || 'Cliente')
              .replace('{clinica}', 'nossa clínica')
              .replace('{procedimento}', appt.procedures?.name || 'seu procedimento')
              .replace('{hora}', new Date(appt.start_time).toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit'}));

            if (rule.trigger_type === 'post_appointment' && rule.benefit_text) {
               // Controle inteligente de avaliação usa benefit_text para guardar json de config
               message = message.replace('{link_agenda}', 'https://g.page/r/YOUR_ID/review'); // Seria puxado do settings no mundo real
            }

            await supabase.from('message_queue').insert({
              company_id: rule.company_id,
              type: 'whatsapp',
              recipient: clientPhone,
              payload: { content: message },
              status: 'pending',
              scheduled_for: nowUtc.toISOString()
            });

            await supabase.from('automation_logs').insert({
              company_id: rule.company_id,
              rule_id: rule.id,
              recipient_phone: clientPhone,
              status: 'queued',
              sent_at: nowUtc.toISOString()
            });

            if (rule.trigger_type === 'pre_appointment') results.reminders++;
            else results.post_appointments++;
          }
        }
      }
    }

    // --- 3. INACTIVE CLIENTS ---
    const inactiveRules = rules.filter(r => r.trigger_type === 'inactive_client');
    for (const rule of inactiveRules) {
        // Ex: 30 dias inativo = 30 * 1440 = 43200 minutos offset
        const thresholdDays = Math.trunc(rule.time_offset_minutes / 1440);
        const thresholdDateUtc = new Date(nowUtc.getTime() - (thresholdDays * 24 * 60 * 60 * 1000));

        const { data: clients } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('company_id', rule.company_id)
          .eq('role', 'client');

        const { data: clientAppts } = await supabase
          .from('appointments')
          .select('client_id, start_time, status')
          .eq('company_id', rule.company_id);

        for (const client of (clients || [])) {
          if (!client.phone) continue;

          const appts = (clientAppts || []).filter(a => a.client_id === client.id);
          const hasFuture = appts.some(a => new Date(a.start_time) > nowUtc && a.status !== 'cancelled');
          if (hasFuture) continue;

          const lastVisit = appts
            .filter(a => new Date(a.start_time) < nowUtc)
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

          const isInactive = !lastVisit || new Date(lastVisit.start_time) < thresholdDateUtc;

          if (isInactive) {
            const { count } = await supabase
              .from('automation_logs')
              .select('*', { count: 'exact', head: true })
              .eq('rule_id', rule.id)
              .eq('recipient_phone', client.phone); // Se já enviou alguma vez pra esse cliente nesta regra de inatividade, nao envia dnv

            if (count === 0) {
              const message = rule.message_template
                  .replace('{cliente}', client.full_name?.split(' ')[0] || 'Cliente')
                  .replace('{clinica}', 'nossa clínica');

              await supabase.from('message_queue').insert({
                company_id: rule.company_id,
                type: 'whatsapp',
                recipient: client.phone,
                payload: { content: message },
                status: 'pending',
                scheduled_for: nowUtc.toISOString()
              });

              await supabase.from('automation_logs').insert({
                company_id: rule.company_id,
                rule_id: rule.id,
                recipient_phone: client.phone,
                status: 'queued',
                sent_at: nowUtc.toISOString()
              });
              results.inactive_clients++;
            }
          }
        }
    }

    // --- 4. BIRTHDAYS ---
    const birthdayRules = rules.filter(r => r.trigger_type === 'birthday');
    if (birthdayRules.length > 0) {
       // O BR hoje no formato MM-DD (considerando o timezone)
       const todayMMDD = nowBr.toISOString().slice(5, 10); 
       
       for (const rule of birthdayRules) {
          // O gatilho de aniversário costuma ser executado às X horas. 
          // O time_offset_minutes neste contexto guarda o horário alvo do dia. 
          // Ex: 540 = 09:00 AM. 
          // Se o horário BR atual passou de 09:00 e ainda não foi enviado hoje, enviamos.
          const currentMinutesOfBrDay = (nowBr.getUTCHours() * 60) + nowBr.getUTCMinutes();
          
          if (currentMinutesOfBrDay >= rule.time_offset_minutes) {
             const { data: celebrants } = await supabase
               .from('profiles')
               .select('*')
               .eq('company_id', rule.company_id)
               .eq('role', 'client')
               .like('birth_date', `%${todayMMDD}`); // birth_date as YYYY-MM-DD

             for (const client of (celebrants || [])) {
                if (!client.phone) continue;

                const { count } = await supabase
                  .from('automation_logs')
                  .select('*', { count: 'exact', head: true })
                  .eq('rule_id', rule.id)
                  .eq('recipient_phone', client.phone)
                  .gte('sent_at', startOfTodayBrUtc.toISOString());

                if (count === 0) {
                   const message = rule.message_template
                      .replace('{cliente}', client.full_name?.split(' ')[0] || 'Cliente');

                   await supabase.from('message_queue').insert({
                     company_id: rule.company_id,
                     type: 'whatsapp',
                     recipient: client.phone,
                     payload: { content: message },
                     status: 'pending',
                     scheduled_for: nowUtc.toISOString()
                   });

                   await supabase.from('automation_logs').insert({
                     company_id: rule.company_id,
                     rule_id: rule.id,
                     recipient_phone: client.phone,
                     status: 'queued',
                     sent_at: nowUtc.toISOString()
                   });
                   results.birthdays++;
                }
             }
          }
       }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('[CRON NOTIFICATIONS] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
