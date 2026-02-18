'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, cn, TextArea, Label } from '@projeto/ui';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function AnamneseForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/anamnese/public?token=${token}`);
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Erro ao carregar');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de obrigatórios
    const missing = data.template.questions.filter((q: any) => q.is_required && !answers[q.id]);
    if (missing.length > 0) {
       toast.error(`Por favor, responda: ${missing[0].question_text}`);
       return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/anamnese/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers })
      });

      if (!res.ok) throw new Error('Falha ao enviar');
      
      setSubmitted(true);
    } catch (err) {
      toast.error('Erro ao enviar respostas. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><span className="text-[#D4AF37] font-bold animate-pulse">Carregando...</span></div>;

  if (error) return (
     <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
        <Card className="w-full max-w-md border-red-100 bg-white shadow-xl">
           <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                 <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-neutral-800">Atenção</h2>
              <p className="text-neutral-500">{error}</p>
           </CardContent>
        </Card>
     </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
        <Card className="w-full max-w-md border-emerald-100 bg-white shadow-xl animate-fade-in">
           <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-scale-in">
                 <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-neutral-800 font-serif">Obrigado!</h2>
                 <p className="text-neutral-500">Sua anamnese foi recebida com sucesso.</p>
              </div>
              {data.company.name && (
                 <div className="pt-4 border-t border-dashed border-neutral-200">
                    <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">{data.company.name}</p>
                 </div>
              )}
           </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 font-sans">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white border-b border-[#E5E0D8] sticky top-0 z-10 shadow-sm">
         <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            {data.company.logo && <img src={data.company.logo} className="h-10 w-10 rounded-full object-cover border border-[#E5E0D8]" alt="Logo" />}
            <div>
               <h1 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{data.company.name}</h1>
               <h2 className="text-lg font-bold text-[#2C2825] font-serif leading-tight">{data.template.title}</h2>
            </div>
         </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
         {data.template.description && (
            <div className="bg-[#FAF6E9] border border-[#E5E0D8] p-4 rounded-2xl mb-8 flex gap-3 text-[#5C5855] text-sm">
               <FileText className="h-5 w-5 shrink-0 text-[#D4AF37]" />
               <p>{data.template.description}</p>
            </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-8">
            {data.template.questions.map((q: any) => (
               <div key={q.id} className="space-y-3 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow">
                  <Label className="text-base font-bold text-[#2C2825] flex items-center gap-2">
                     <span className="bg-[#F5F5DC] text-[#8A847C] w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">{q.order}</span>
                     {q.question_text} {q.is_required && <span className="text-red-400 text-xs ml-1">*</span>}
                  </Label>
                  
                  {q.type === 'text_short' && (
                     <Input 
                        placeholder="Sua resposta..." 
                        className="bg-[#FAF9F6] border-[#E5E0D8] h-12 rounded-xl focus:border-[#D4AF37]"
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                     />
                  )}

                  {q.type === 'text_long' && (
                     <TextArea
                        placeholder="Descreva detalhadamente..."
                        className="bg-[#FAF9F6] border-[#E5E0D8] min-h-[100px] rounded-xl focus:border-[#D4AF37]"
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                     />
                  )}

                  {q.type === 'yes_no' && (
                     <div className="flex gap-4">
                        {['Sim', 'Não'].map(opt => (
                           <button
                              key={opt}
                              type="button"
                              onClick={() => setAnswers({...answers, [q.id]: opt})}
                              className={cn(
                                 "flex-1 py-3 rounded-xl border font-bold transition-all",
                                 answers[q.id] === opt 
                                    ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20" 
                                    : "bg-white border-[#E5E0D8] text-[#8A847C] hover:bg-[#FAF9F6]"
                              )}
                           >
                              {opt}
                           </button>
                        ))}
                     </div>
                  )}
                  {/* Outros tipos aqui (date, number, etc) podem ser adicionados conforme a necessidade */}
               </div>
            ))}

            <div className="pt-6">
                <Button 
                   type="submit" 
                   className="w-full h-14 bg-[#2C2825] hover:bg-black text-[#D4AF37] font-bold text-lg rounded-2xl shadow-xl shadow-black/10"
                   loading={submitting}
                >
                   Finalizar e Enviar
                </Button>
                <p className="text-center text-xs text-neutral-400 mt-4 font-medium uppercase tracking-widest">Seus dados estão protegidos • Agenda Inteligente</p>
            </div>
         </form>
      </main>
    </div>
  );
}
