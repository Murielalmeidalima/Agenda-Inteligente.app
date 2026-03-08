'use client';

import { useState, useRef } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  TextArea,
  Badge,
  cn
} from '@projeto/ui';
import { 
  FileText, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Stethoscope,
  ClipboardList,
  Upload,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface MedicalRecord {
  id: string;
  type: 'legacy' | 'progress' | 'appointment_record' | 'anamnese' | 'attachment';
  content?: string;
  progress_notes?: string;
  clinical_notes?: string;
  procedure_performed?: string;
  materials_used?: string;
  complications?: string;
  template?: { name: string };
  appointment?: { procedures: { name: string } };
  file_url?: string;
  file_type?: string;
  description?: string;
  status?: string;
  created_at: string;
  professional?: {
    full_name: string;
  };
}

interface MedicalTimelineProps {
  records: MedicalRecord[];
  clientId: string;
  companyId: string;
  professionalId: string;
  onAddRecord: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function MedicalTimeline({ 
  records, 
  clientId,
  companyId,
  professionalId,
  onAddRecord,
  isSubmitting = false
}: MedicalTimelineProps) {
  const [newRecordContent, setNewRecordContent] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!newRecordContent.trim()) return;
    await onAddRecord(newRecordContent);
    setNewRecordContent('');
    setIsExpanding(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createBrowserClient();
    
    try {
      const fileName = `${clientId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinical_attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinical_attachments')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('medical_attachments')
        .insert({
          company_id: companyId,
          client_id: clientId,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          file_url: publicUrl,
          file_type: file.type,
          description: file.name
        });

      if (dbError) throw dbError;

      toast.success('Arquivo enviado com sucesso!');
      window.location.reload(); // Refresh to show new attachment
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* New Record Action */}
      <div className="flex gap-4">
        {!isExpanding ? (
          <Button 
            onClick={() => setIsExpanding(true)} 
            className="flex-1 h-16 border-dashed border-2 bg-transparent hover:bg-primary-50 text-primary-600 border-primary-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Evolução Clínica
          </Button>
        ) : null}

        <Button 
          variant="outline"
          onClick={() => fileInputRef.current?.click()} 
          loading={isUploading}
          className="flex-1 h-16 border-dashed border-2 bg-transparent hover:bg-emerald-50 text-emerald-600 border-emerald-200"
        >
          <Camera className="h-5 w-5 mr-2" />
          Anexar Foto / Documento
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*,application/pdf"
        />
      </div>

      {isExpanding && (
        <Card className="border-primary-200 shadow-md animate-in fade-in zoom-in duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" />
              Nova Entrada no Prontuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextArea 
              placeholder="Descreva a evolução do paciente, procedimentos realizados e observações clínicas..."
              className="min-h-[200px] text-base"
              value={newRecordContent}
              onChange={(e) => setNewRecordContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsExpanding(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                loading={isSubmitting}
                disabled={!newRecordContent.trim()}
              >
                Salvar Evolução
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
        {records.length === 0 && !isExpanding && (
          <div className="pl-12 py-8 text-neutral-500 italic">
            Nenhum registro clínico encontrado para este paciente.
          </div>
        )}

        {records.map((record) => (
          <div key={record.id} className="relative pl-12">
            {/* Timeline Dot */}
            <div className={cn(
               "absolute left-0 w-10 h-10 bg-white border-2 rounded-full flex items-center justify-center z-10 shadow-sm",
               record.type === 'anamnese' ? "border-amber-500 text-amber-500" :
               record.type === 'attachment' ? "border-emerald-500 text-emerald-500" :
               record.type === 'appointment_record' ? "border-blue-500 text-blue-500" :
               "border-primary-500 text-primary-500"
            )}>
              {record.type === 'anamnese' && <ClipboardList className="h-5 w-5" />}
              {record.type === 'attachment' && <ImageIcon className="h-5 w-5" />}
              {record.type === 'appointment_record' && <Stethoscope className="h-5 w-5" />}
              {(record.type === 'legacy' || record.type === 'progress') && <CheckCircle2 className="h-5 w-5" />}
            </div>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1 font-medium text-neutral-900">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(record.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(record.created_at), "HH:mm")}
                    </span>
                    {record.professional && (
                      <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-full">
                        <User className="h-3 w-3" />
                        {record.professional.full_name}
                      </span>
                    )}
                  </div>
                  <Badge variant={
                    record.type === 'anamnese' ? 'warning' :
                    record.type === 'attachment' ? 'success' :
                    record.type === 'appointment_record' ? 'default' :
                    'secondary'
                  }>
                    {record.type === 'anamnese' && 'Anamnese'}
                    {record.type === 'attachment' && 'Anexo'}
                    {record.type === 'appointment_record' && 'Atendimento'}
                    {record.type === 'legacy' && 'Nota Geral'}
                    {record.type === 'progress' && 'Evolução'}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {/* Rendering based on type */}
                  {(record.type === 'legacy' || record.type === 'progress') && (
                    <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {record.content || record.progress_notes}
                    </div>
                  )}

                  {record.type === 'appointment_record' && (
                    <div className="space-y-3">
                       <h4 className="font-bold text-blue-700 text-sm uppercase tracking-wider">
                          Procedimento: {record.appointment?.procedures?.name || 'Não informado'}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                             <p className="font-bold text-neutral-500 uppercase text-[10px]">Notas Clínicas</p>
                             <p className="text-neutral-700">{record.clinical_notes || '-'}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="font-bold text-neutral-500 uppercase text-[10px]">Materiais</p>
                             <p className="text-neutral-700">{record.materials_used || '-'}</p>
                          </div>
                       </div>
                       {record.complications && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
                             <p className="font-bold mb-1">COMPLICAÇÕES:</p>
                             <p>{record.complications}</p>
                          </div>
                       )}
                    </div>
                  )}

                  {record.type === 'anamnese' && (
                    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <ClipboardList className="h-5 w-5 text-amber-600" />
                          <div>
                             <p className="font-bold text-amber-900">{record.template?.name}</p>
                             <p className="text-xs text-amber-700">Respondida pelo paciente</p>
                          </div>
                       </div>
                       <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => window.open(`/api/anamnese/export-pdf?response_id=${record.id}`, '_blank')}>
                          Ver PDF
                       </Button>
                    </div>
                  )}

                  {record.type === 'attachment' && (
                    <div className="space-y-3">
                       {record.file_type?.startsWith('image/') ? (
                          <img 
                            src={record.file_url} 
                            alt={record.description} 
                            className="rounded-2xl border border-neutral-100 max-h-[400px] w-auto shadow-sm"
                          />
                       ) : (
                          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                             <Upload className="h-5 w-5 text-emerald-600" />
                             <p className="font-medium text-emerald-900">{record.description}</p>
                          </div>
                       )}
                       {record.description && record.file_type?.startsWith('image/') && (
                         <p className="text-xs text-neutral-500 italic">{record.description}</p>
                       )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
