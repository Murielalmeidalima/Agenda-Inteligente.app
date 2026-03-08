'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, cn, TextArea, Label } from '@projeto/ui';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

export default function AnamneseForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isExternal, setIsExternal] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Novos campos: LGPD e Assinatura
  const [consentAccepted, setConsentAccepted] = useState(false);
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/anamnese/public?token=${token}`);
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Erro ao carregar');
        }
        const json = await res.json();
        if (json.template.externalFormUrl) {
          setIsExternal(true);
          setExternalUrl(json.template.externalFormUrl);
        }
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
    // Validação da assinatura e consentimento
    if (!consentAccepted) {
       toast.error('Você precisa aceitar o Termo de Consentimento.');
       return;
    }
    
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
       toast.error('Por favor, assine o documento antes de enviar.');
       return;
    }
    
    const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    setSubmitting(true);
    try {
      const res = await fetch('/api/anamnese/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers, consentAccepted, signatureDataUrl })
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

  if (isExternal) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 text-[#2C2825]">
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {data?.company?.logo && (
             <img src={data.company.logo} alt={data.company.name} className="h-16 mx-auto mb-8" />
           )}
           <div className="bg-white p-10 rounded-[40px] shadow-xl border border-[#E5E0D8] space-y-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                 <FileText className="h-10 w-10 text-primary-600" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Formulário Externo</h1>
              <p className="text-[#5C5855] leading-relaxed">
                Esta ficha de anamnese é respondida em uma plataforma externa ({externalUrl ? new URL(externalUrl).hostname : ''}). 
                Clique no botão abaixo para preencher.
              </p>
              <Button 
                onClick={() => window.location.href = externalUrl}
                className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-primary-200 transition-all hover:scale-[1.02]"
              >
                ABRIR FORMULÁRIO
              </Button>
              <p className="text-[10px] text-[#8A847C] uppercase font-bold tracking-widest">
                Você será redirecionado para o site parceiro da clínica.
              </p>
           </div>
        </div>
      </div>
    );
  }

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

             <div className="bg-[#FAF6E9] p-6 rounded-3xl border border-[#E5E0D8] space-y-6">
                <div>
                   <h3 className="text-base font-bold text-[#2C2825] mb-2">Termo de Consentimento</h3>
                   <p className="text-sm text-[#5C5855] leading-relaxed mb-4">
                      Declaro que as informações acima são verdadeiras. Autorizo a clínica a utilizar estes dados estritamente para fins de avaliação e acompanhamento clínico, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                   </p>
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                         <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-[#E5E0D8] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                            checked={consentAccepted}
                            onChange={(e) => setConsentAccepted(e.target.checked)}
                         />
                      </div>
                      <span className="text-sm font-bold text-[#2C2825] group-hover:text-[#D4AF37] transition-colors">Li e concordo com o termo de consentimento</span>
                   </label>
                </div>

                <div className="pt-4 border-t border-[#E5E0D8]/50">
                   <h3 className="text-base font-bold text-[#2C2825] mb-2">Assinatura Digital</h3>
                   <p className="text-xs text-[#8A847C] mb-4">Por favor, assine no quadro abaixo usando o mouse ou o dedo.</p>
                   
                   <div className="bg-white border-2 border-dashed border-[#E5E0D8] rounded-2xl overflow-hidden relative touch-none hover:border-[#D4AF37] transition-colors">
                      <SignatureCanvas 
                         ref={sigCanvas}
                         penColor="#2C2825"
                         canvasProps={{
                            className: 'w-full h-40 cursor-crosshair'
                         }}
                      />
                      <button 
                         type="button" 
                         onClick={() => sigCanvas.current?.clear()}
                         className="absolute bottom-2 right-2 px-3 py-1 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                         Limpar
                      </button>
                   </div>
                </div>
             </div>

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
