'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge } from '@projeto/ui';
import { ArrowLeft, User, Calendar, CheckCircle2, FileText, Smartphone } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AnamneseResponseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [response, setResponse] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchDetails();
  }, [params.id]);

  async function fetchDetails() {
    try {
      const supabase = createBrowserClient();
      
      // 1. Fetch Response Header
      const { data: respData, error: respError } = await supabase
        .from('anamnese_responses')
        .select(`
          *,
          anamnese_templates (name, description),
          clients (full_name, phone, email, birth_date)
        `)
        .eq('id', params.id)
        .single();

      if (respError) throw respError;
      setResponse(respData);

      // 2. Fetch Answers with Question Text
      const { data: ansData, error: ansError } = await supabase
        .from('anamnese_answers')
        .select(`
          *,
          anamnese_questions (question_text, type)
        `)
        .eq('response_id', params.id)
        .order('created_at', { ascending: true }); // Or use question order if joined properly

      if (ansError) throw ansError;
      setAnswers(ansData || []);

    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-[#5C5855]">Carregando detalhes...</div>;
  if (!response) return <div className="p-8 text-[#5C5855]">Resposta não encontrada.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
       {/* Header */}
       <div className="flex items-center gap-4">
          <Link href="/dashboard/anamnese/responses">
             <Button variant="ghost" size="icon" className="text-[#2C2825] bg-button-hover rounded-xl">
                <ArrowLeft className="h-5 w-5" />
             </Button>
          </Link>
          <div>
             <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-[#2C2825]">Detalhes da Anamnese</h1>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Concluído</Badge>
             </div>
             <p className="text-[#5C5855] text-sm">Visualizando respostas do paciente.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Info */}
          <div className="space-y-6">
             {/* Cliente Info */}
             <Card className="bg-white border-[#E5E0D8] rounded-3xl">
                <CardContent className="p-6 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#FAF9F6] text-[#8A847C]">
                         <User className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-xs text-neutral-400 font-bold uppercase">Paciente</p>
                         <p className="text-[#2C2825] font-bold">{response.clients?.full_name}</p>
                      </div>
                   </div>
                   
                   <div className="pt-4 border-t border-neutral-800 space-y-2 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                         <Smartphone className="h-4 w-4" />
                         <span>{response.clients?.phone || 'Sem telefone'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Calendar className="h-4 w-4" />
                         <span>Nasc: {response.clients?.birth_date ? format(new Date(response.clients.birth_date), 'dd/MM/yyyy') : 'N/A'}</span>
                      </div>
                   </div>
                </CardContent>
             </Card>

             {/* Metadata */}
             <Card className="bg-white border-[#E5E0D8] rounded-3xl">
                <CardContent className="p-6 space-y-4">
                   <div>
                      <p className="text-xs text-neutral-400 font-bold uppercase mb-1">Modelo Utilizado</p>
                      <div className="flex items-center gap-2 text-[#2C2825] font-medium">
                         <FileText className="h-4 w-4 text-primary-500" />
                         {response.anamnese_templates?.name}
                      </div>
                   </div>
                   
                   <div>
                      <p className="text-xs text-neutral-400 font-bold uppercase mb-1">Data da Resposta</p>
                      <div className="flex items-center gap-2 text-[#2C2825] font-medium">
                         <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                         {response.completed_at ? format(new Date(response.completed_at), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Pendente'}
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Respostas (Main Content) */}
          <div className="md:col-span-2 space-y-4">
             <h2 className="text-xl font-bold text-[#2C2825] px-2">Respostas ({answers.length})</h2>
             
             {answers.map((ans, index) => (
                <Card key={ans.id} className="bg-white border-[#E5E0D8] rounded-2xl">
                   <CardContent className="p-6 space-y-3">
                      
                      <div className="flex items-start gap-3">
                         <span className="bg-[#FAF9F6] text-[#5C5855] text-xs font-bold px-2 py-1 rounded-md mt-0.5">
                            #{index + 1}
                         </span>
                         <h3 className="text-[#2C2825] font-bold text-lg leading-snug">
                            {ans.anamnese_questions?.question_text}
                         </h3>
                      </div>

                      <div className="pl-11">
                         <div className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825]">
                            {renderAnswerValue(ans.answer_value, ans.anamnese_questions?.type)}
                         </div>
                      </div>

                   </CardContent>
                </Card>
             ))}
          </div>
       </div>
    </div>
  );
}

function renderAnswerValue(value: any, type: string) {
  if (!value) return <span className="text-neutral-500 italic">Sem resposta</span>;

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((v: string, i: number) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
    );
  }

  if (type === 'yes_no') {
     return value === 'true' || value === true ? 'Sim' : 'Não';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value); 
  }

  return <span>{String(value)}</span>;
}
