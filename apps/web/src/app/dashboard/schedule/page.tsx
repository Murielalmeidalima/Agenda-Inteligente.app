import { createServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ScheduleCalendarClient from './schedule-calendar-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const supabase = createServerClient();
  
  // Authentication Check
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_id, role, approved, permissions')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.company_id) {
    console.error('Profile error:', profileError);
    // Handle case where user has no profile or company
    return (
       <div className="flex h-screen items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Perfil não configurado</h2>
            <p className="text-neutral-500">Entre em contato com o suporte ou refaça o login.</p>
          </div>
       </div>
    );
  }

  if (!profile.approved) {
    redirect('/auth/pending'); // página dedicada — não causa loop com middleware
  }

  // Check RBAC Permissions
  if (profile.role !== 'admin' && profile.role !== 'chefe') {
    const permissions = (profile.permissions as any) || {};
    if (!permissions.agenda?.view) {
      redirect('/dashboard');
    }
  }


  return (
    <Suspense fallback={<div className="text-center py-10">Carregando agenda...</div>}>
      <ScheduleCalendarClient 
        initialAppointments={[]}
        clients={[]}
        procedures={[]}
        professionals={[]}
        companyId={profile.company_id}
      />
    </Suspense>
  );
}
