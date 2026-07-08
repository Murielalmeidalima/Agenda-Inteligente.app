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

export default async function ClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
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
    .select('*, procedures(name), additional_procedure_ids')
    .eq('client_id', params.id)
    .order('start_time', { ascending: false });

  // Buscar todos os procedimentos para mapear nomes no histórico
  const { data: procedures } = await supabase
    .from('procedures')
    .select('id, name')
    .eq('company_id', profile?.company_id);

  // Buscar registros médicos legados (Prontuário Geral)
  const { data: medicalRecords } = await supabase
    .from('medical_records')
    .select(`*, professional:profiles(full_name)`)
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  // Buscar novas notas de evolução
  const { data: progressNotes } = await supabase
    .from('patient_progress_notes')
    .select(`*, professional:profiles(full_name)`)
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  // Buscar fichas de atendimento detalhadas
  const { data: appointmentRecords } = await supabase
    .from('appointment_medical_records')
    .select(`*, professional:profiles(full_name), appointment:appointments(procedures(name))`)
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  // Buscar anamneses respondidas
  const { data: anamneses } = await supabase
    .from('anamnese_responses')
    .select(`*, template:anamnese_templates(name)`)
    .eq('client_id', params.id)
    .eq('status', 'completed_client')
    .order('completed_at', { ascending: false });

  // Buscar anexos clínicos (fotos)
  const { data: attachments } = await supabase
    .from('medical_attachments')
    .select(`*, professional:profiles(full_name)`)
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
        progressNotes={progressNotes || []}
        appointmentRecords={appointmentRecords || []}
        anamneses={anamneses || []}
        attachments={attachments || []}
        appointments={clientAppointments || []}
        procedures={procedures || []}
        currentProfessionalId={user.id}
      />
    </div>
  );
}
