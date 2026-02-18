'use client';

import { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalRecord {
  id: string;
  content: string;
  status: 'draft' | 'finalized';
  created_at: string;
  professional: {
    full_name: string;
  };
}

interface MedicalTimelineProps {
  records: MedicalRecord[];
  onAddRecord: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function MedicalTimeline({ 
  records, 
  onAddRecord,
  isSubmitting = false
}: MedicalTimelineProps) {
  const [newRecordContent, setNewRecordContent] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);

  const handleSubmit = async () => {
    if (!newRecordContent.trim()) return;
    await onAddRecord(newRecordContent);
    setNewRecordContent('');
    setIsExpanding(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* New Record Action */}
      {!isExpanding ? (
        <Button 
          onClick={() => setIsExpanding(true)} 
          className="w-full h-16 border-dashed border-2 bg-transparent hover:bg-primary-50 text-primary-600 border-primary-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Evolução Clínica
        </Button>
      ) : (
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
            <div className="absolute left-0 w-10 h-10 bg-white border-2 border-primary-500 rounded-full flex items-center justify-center z-10 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-primary-500" />
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
                    <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-full">
                      <User className="h-3 w-3" />
                      {record.professional.full_name}
                    </span>
                  </div>
                  <Badge variant={record.status === 'finalized' ? 'success' : 'secondary'}>
                    {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                  </Badge>
                </div>
                
                <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {record.content}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
