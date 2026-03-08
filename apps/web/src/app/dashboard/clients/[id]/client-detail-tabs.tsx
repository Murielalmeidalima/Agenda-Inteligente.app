'use client';

import { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge
} from '@projeto/ui';
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  User, 
  Clock, 
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import MedicalTimeline from '@/components/medical/medical-timeline';
import { createBrowserClient } from '@/lib/supabase-browser';

interface ClientTabsProps {
  client: any;
  initialRecords: any[];
  progressNotes?: any[];
  appointmentRecords?: any[];
  anamneses?: any[];
  attachments?: any[];
  appointments: any[];
  currentProfessionalId: string;
}

export default function ClientDetailTabs({ 
  client, 
  initialRecords, 
  progressNotes = [],
  appointmentRecords = [],
  anamneses = [],
  attachments = [],
  appointments,
  currentProfessionalId
}: ClientTabsProps) {
  const [records, setRecords] = useState(initialRecords);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unificar todos os eventos clínicos em uma única timeline
  const timelineEvents = [
     ...initialRecords.map(r => ({ ...r, type: 'legacy' })),
     ...progressNotes.map(n => ({ ...n, type: 'progress' })),
     ...appointmentRecords.map(ar => ({ ...ar, type: 'appointment_record' })),
     ...anamneses.map(a => ({ ...a, type: 'anamnese', created_at: a.completed_at })),
     ...attachments.map(at => ({ ...at, type: 'attachment' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleAddRecord = async (content: string) => {
    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          company_id: client.company_id,
          client_id: client.id,
          professional_id: currentProfessionalId,
          content,
          status: 'finalized'
        })
        .select(`
          *,
          professional:profiles(full_name)
        `)
        .single();

      if (error) throw error;
      setRecords([data, ...records]);
    } catch (error) {
      console.error('Error adding medical record:', error);
      alert('Erro ao salvar prontuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="info" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Informações
        </TabsTrigger>
        <TabsTrigger value="appointments" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Agendamentos
        </TabsTrigger>
        <TabsTrigger value="medical" className="flex items-center gap-2 text-primary-600">
          <Stethoscope className="h-4 w-4" />
          Prontuário
        </TabsTrigger>
      </TabsList>

      {/* Info Tab */}
      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-bold">Email</p>
                  <p className="text-neutral-900 font-medium">{client.email || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <Phone className="h-5 w-5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-bold">Telefone</p>
                  <p className="text-neutral-900 font-medium">{client.phone || 'Não informado'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-bold">Nascimento</p>
                  <p className="text-neutral-900 font-medium">{formatDate(client.birth_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase font-bold">Cliente desde</p>
                  <p className="text-neutral-900 font-medium">{formatDate(client.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Appointments Tab */}
      <TabsContent value="appointments">
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                Nenhum agendamento encontrado para este cliente.
              </CardContent>
            </Card>
          ) : (
            appointments.map((apt) => (
              <Card key={apt.id} className="hover:border-primary-200 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                      <Calendar className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">{apt.procedures?.name}</p>
                      <p className="text-sm text-neutral-500">
                        {formatDate(apt.start_time)} às {new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'secondary'}>
                    {apt.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Medical Record Tab */}
      <TabsContent value="medical">
        <MedicalTimeline 
          records={timelineEvents} 
          clientId={client.id}
          companyId={client.company_id}
          professionalId={currentProfessionalId}
          onAddRecord={handleAddRecord}
          isSubmitting={isSubmitting}
        />
      </TabsContent>
    </Tabs>
  );
}
