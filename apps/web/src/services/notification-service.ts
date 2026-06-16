import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase URL and Service Role Key are required for admin operations.');
    }
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

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
    const supabaseAdmin = getSupabaseAdmin();
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
