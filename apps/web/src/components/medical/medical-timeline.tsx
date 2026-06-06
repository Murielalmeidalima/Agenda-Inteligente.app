'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
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
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* New Record Action */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!isExpanding ? (
          <Button 
            onClick={() => setIsExpanding(true)} 
            className="flex-1 h-16 border-dashed border-2 bg-white hover:bg-[#D4AF37]/5 text-[#D4AF37] border-[#D4AF37]/30 hover:border-[#D4AF37] shadow-sm rounded-2xl transition-all duration-300 font-bold text-lg"
          >
            <Plus className="h-6 w-6 mr-3" />
            Nova Evolução Clínica
          </Button>
        ) : null}

        <Button 
          variant="outline"
          onClick={() => fileInputRef.current?.click()} 
          loading={isUploading}
          className="flex-1 h-16 border-dashed border-2 bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400 shadow-sm rounded-2xl transition-all duration-300 font-bold text-lg"
        >
          <Camera className="h-6 w-6 mr-3" />
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
        <Card className="border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/5 animate-in fade-in zoom-in duration-300 rounded-[2rem] bg-gradient-to-br from-[#FAF9F6] to-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <CardHeader className="pb-4 border-b border-[#E5E0D8]/50">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-[#2C2825] font-serif">
              <FileText className="h-6 w-6 text-[#D4AF37]" />
              Nova Entrada no Prontuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
            <TextArea 
              placeholder="Descreva a evolução do paciente, procedimentos realizados e observações clínicas..."
              className="min-h-[200px] text-base bg-white border-[#E5E0D8] rounded-2xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 resize-none shadow-inner p-5"
              value={newRecordContent}
              onChange={(e) => setNewRecordContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsExpanding(false)} className="h-12 px-6 rounded-xl font-bold text-[#8A847C] hover:bg-neutral-100">
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                loading={isSubmitting}
                disabled={!newRecordContent.trim()}
                className="h-12 px-8 rounded-xl font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-[#D4AF37]/20 transition-transform active:scale-95"
              >
                Salvar Evolução
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-10 before:absolute before:inset-0 before:ml-[1.15rem] sm:before:ml-8 before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-[#D4AF37]/10 before:via-[#E5E0D8] before:to-transparent">
        {records.length === 0 && !isExpanding && (
          <div className="pl-16 py-12 text-center text-[#8A847C] font-medium bg-[#FAF9F6] rounded-3xl border border-dashed border-[#E5E0D8]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#E5E0D8]">
              <FileText className="h-8 w-8 text-[#D4AF37]/40" />
            </div>
            <p className="text-lg">Nenhum registro clínico encontrado para este paciente.</p>
            <p className="text-sm mt-1">Comece clicando em "Nova Evolução Clínica" acima.</p>
          </div>
        )}

        {records.map((record) => (
          <div key={record.id} className="relative pl-12 sm:pl-20 group">
            {/* Timeline Dot */}
            <div className={cn(
               "absolute left-0 sm:left-[18px] top-4 w-10 h-10 bg-white border-4 rounded-full flex items-center justify-center z-10 shadow-[0_0_0_4px_white] transition-transform duration-500 group-hover:scale-125",
               record.type === 'anamnese' ? "border-amber-400 text-amber-500" :
               record.type === 'attachment' ? "border-emerald-400 text-emerald-500" :
               record.type === 'appointment_record' ? "border-blue-400 text-blue-500" :
               "border-[#D4AF37] text-[#D4AF37]"
            )}>
              {record.type === 'anamnese' && <ClipboardList className="h-4 w-4" />}
              {record.type === 'attachment' && <ImageIcon className="h-4 w-4" />}
              {record.type === 'appointment_record' && <Stethoscope className="h-4 w-4" />}
              {(record.type === 'legacy' || record.type === 'progress') && <CheckCircle2 className="h-4 w-4" />}
            </div>

            <Card className="rounded-[2rem] border-[#E5E0D8] hover:border-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 overflow-hidden bg-white hover:-translate-y-1">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5E0D8]/60">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm text-[#8A847C]">
                    <span className="flex items-center gap-1.5 font-bold text-[#2C2825] bg-[#FAF9F6] px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      {format(new Date(record.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="h-4 w-4" />
                      {format(new Date(record.created_at), "HH:mm")}
                    </span>
                    {record.professional && (
                      <span className="flex items-center gap-1.5 bg-[#FAF9F6] px-3 py-1.5 rounded-lg border border-[#E5E0D8] font-bold text-[#5C5855]">
                        <User className="h-4 w-4 text-[#8A847C]" />
                        {record.professional.full_name}
                      </span>
                    )}
                  </div>
                  <Badge className={cn(
                    "px-3 py-1 uppercase tracking-widest text-[9px] font-black rounded-lg shadow-sm border",
                    record.type === 'anamnese' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    record.type === 'attachment' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    record.type === 'appointment_record' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-[#D4AF37]/10 text-[#b5952f] border-[#D4AF37]/20'
                  )}>
                    {record.type === 'anamnese' && 'Anamnese'}
                    {record.type === 'attachment' && 'Anexo'}
                    {record.type === 'appointment_record' && 'Atendimento'}
                    {record.type === 'legacy' && 'Nota Geral'}
                    {record.type === 'progress' && 'Evolução'}
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {/* Rendering based on type */}
                  {(record.type === 'legacy' || record.type === 'progress') && (
                    <div className="prose prose-sm max-w-none text-[#5C5855] whitespace-pre-wrap leading-relaxed font-medium bg-[#FAF9F6] p-6 rounded-2xl border border-[#E5E0D8]/50 shadow-inner">
                      {record.content || record.progress_notes}
                    </div>
                  )}

                  {record.type === 'appointment_record' && (
                    <div className="space-y-4">
                       <h4 className="font-black text-blue-800 text-base uppercase tracking-widest flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                          Procedimento: <span className="text-blue-600">{record.appointment?.procedures?.name || 'Não informado'}</span>
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-[#FAF9F6] p-6 rounded-2xl border border-[#E5E0D8]/50 shadow-inner">
                          <div className="space-y-1.5">
                             <p className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Notas Clínicas</p>
                             <p className="text-[#5C5855] font-medium leading-relaxed">{record.clinical_notes || '-'}</p>
                          </div>
                          <div className="space-y-1.5">
                             <p className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Materiais</p>
                             <p className="text-[#5C5855] font-medium leading-relaxed">{record.materials_used || '-'}</p>
                          </div>
                       </div>
                       {record.complications && (
                          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-sm shadow-sm">
                             <p className="font-black mb-1 uppercase tracking-widest text-[10px] text-red-600">Complicações Identificadas:</p>
                             <p className="font-medium">{record.complications}</p>
                          </div>
                       )}
                    </div>
                  )}

                  {record.type === 'anamnese' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl hover:bg-amber-50 transition-colors shadow-sm gap-4">
                       <div className="flex items-center gap-4">
                          <div className="bg-amber-100 p-3 rounded-xl border border-amber-200">
                             <ClipboardList className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                             <p className="font-black text-amber-900 text-lg leading-tight">{record.template?.name}</p>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mt-1">Preenchido pelo paciente</p>
                          </div>
                       </div>
                       <Button className="h-10 px-6 rounded-xl font-bold bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800 shadow-sm transition-colors" onClick={() => window.open(`/api/anamnese/export-pdf?response_id=${record.id}`, '_blank')}>
                          Ver Respostas (PDF)
                       </Button>
                    </div>
                  )}

                  {record.type === 'attachment' && (
                    <div className="space-y-4">
                       {record.file_type?.startsWith('image/') ? (
                          <div className="relative w-full max-w-[600px] h-[400px] rounded-2xl overflow-hidden group/img cursor-pointer border border-[#E5E0D8] shadow-sm">
                             <Image 
                               src={record.file_url!} 
                               alt={record.description || "Anexo"} 
                               fill
                               className="object-contain bg-[#FAF9F6] transition-transform duration-500 group-hover/img:scale-105"
                               unoptimized
                             />
                             <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
                          </div>
                       ) : (
                          <div className="flex items-center gap-4 p-5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer" onClick={() => window.open(record.file_url!, '_blank')}>
                             <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200">
                                <Upload className="h-6 w-6 text-emerald-600" />
                             </div>
                             <div>
                               <p className="font-black text-emerald-900 text-lg leading-tight truncate">{record.description}</p>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mt-1">Clique para abrir documento</p>
                             </div>
                          </div>
                       )}
                       {record.description && record.file_type?.startsWith('image/') && (
                         <p className="text-sm text-[#8A847C] font-semibold flex items-center gap-2">
                           <ImageIcon className="w-4 h-4" />
                           {record.description}
                         </p>
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
