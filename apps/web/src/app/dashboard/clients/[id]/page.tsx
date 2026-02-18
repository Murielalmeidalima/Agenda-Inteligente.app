import { createServerClient } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@projeto/ui';
import { ArrowLeft, Edit, Mail, Phone, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import ClientDetailTabs from './client-detail-tabs';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Buscar cliente
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !client) {
    notFound();
  }

  // Verificar se cliente pertence à mesma empresa do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (client.company_id !== profile?.company_id) {
    notFound();
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(client.birth_date);

  // Buscar agendamentos do cliente
  const { data: clientAppointments } = await supabase
    .from('appointments')
    .select('*, procedures(name)')
    .eq('client_id', params.id)
    .order('start_time', { ascending: false });

  // Buscar registros médicos (Prontuário)
  const { data: medicalRecords } = await supabase
    .from('medical_records')
    .select(`
      *,
      professional:profiles(full_name)
    `)
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="hover:bg-neutral-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{client.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-none font-medium">
                Cliente desde {new Date(client.created_at).getFullYear()}
              </Badge>
              {age && (
                <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-none font-medium">
                  {age} anos
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="secondary" className="shadow-sm">
              <Edit className="h-4 w-4" />
              Editar Cadastro
            </Button>
          </Link>
        </div>
      </div>

      <ClientDetailTabs 
        client={client}
        initialRecords={medicalRecords || []}
        appointments={clientAppointments || []}
        currentProfessionalId={user.id}
      />
    </div>
  );
}
