import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createNotification({ 
  companyId, 
  userId, 
  title, 
  message, 
  type, 
  link 
}: { 
  companyId: string, 
  userId?: string, 
  title: string, 
  message: string, 
  type: 'appointment' | 'reminder' | 'confirmation' | 'system', 
  link?: string 
}) {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      company_id: companyId,
      user_id: userId, // Optional, null means whole company (or logic can vary)
      title,
      message,
      type,
      link
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}
