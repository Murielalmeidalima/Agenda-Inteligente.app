'use client';

import { EmployeeManagementClient } from './EmployeeManagementClient';
import { useProfile } from '@/providers/profile-provider';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EmployeesPage() {
  const { profile, loading, hasPermission } = useProfile();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Apenas Administrador ou Chefe pode acessar esta tela
  if (profile?.role !== 'admin' && profile?.role !== 'chefe') {
    redirect('/dashboard');
  }

  return <EmployeeManagementClient companyId={profile.company_id!} />;
}
