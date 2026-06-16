import nodemailer from 'nodemailer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Admin for logging (bypassing RLS)
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase URL and Service Role Key are required for email operations.');
    }
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function logEmail(appointmentId: string | undefined, companyId: string, recipient: string, type: string, status: 'sent' | 'failed', error?: any) {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('email_logs').insert({
        appointment_id: appointmentId,
        company_id: companyId,
        recipient_email: recipient,
        type,
        status,
        error_message: error ? JSON.stringify(error) : null
    });
}

export async function sendEmail({ to, subject, html, appointmentId, companyId, type }: { to: string; subject: string; html: string; appointmentId?: string, companyId: string, type: 'confirmation' | 'reminder' | 'review' | 'cancellation' }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Agenda Inteligente" <noreply@agendainteligente.com>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    await logEmail(appointmentId, companyId, to, type, 'sent');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    await logEmail(appointmentId, companyId, to, type, 'failed', error);
    return { success: false, error };
  }
}

export const emailTemplates = {
  confirmation: (clientName: string, date: string, time: string, link: string) => `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
      <h1 style="color: #D4AF37;">Confirmação de Agendamento</h1>
      <p>Olá, <strong>${clientName}</strong>!</p>
      <p>Seu agendamento está confirmado para <strong>${date} às ${time}</strong>.</p>
      <p>Para confirmar sua presença, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar Presença</a>
      </div>
      <p style="font-size: 12px; color: #777;">Caso não possa comparecer, entre em contato para reagendar.</p>
    </div>
  `,
  reminder: (clientName: string, date: string, time: string, link: string) => `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
      <h1 style="color: #D4AF37;">Lembrete de Agendamento</h1>
      <p>Olá <strong>${clientName}</strong>, este é um lembrete do seu horário amanhã.</p>
      <p><strong>Data:</strong> ${date}<br><strong>Horário:</strong> ${time}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Detalhes</a>
      </div>
    </div>
  `,
  review: (clientName: string, link: string) => `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
      <h1 style="color: #D4AF37;">Como foi sua experiência?</h1>
      <p>Olá <strong>${clientName}</strong>, obrigado pela visita! Gostaríamos muito de saber sua opinião para melhorarmos sempre.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Avaliar Atendimento</a>
      </div>
    </div>
  `
};
