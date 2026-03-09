'use client';

import { useState } from 'react';
import { Button, Card, CardContent, TextArea } from '@projeto/ui'; // Assuming Star component exists or make one
import { Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewAppointmentPage({ params }: { params: { token: string } }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  useState(() => {
    fetch(`/api/reviews/settings?token=${params.token}`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  });

  async function handleSubmit() {
    if (rating === 0) return toast.error('Por favor, selecione uma nota.');
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/review', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: params.token, rating, comment })
      });
      
      if (!res.ok) throw new Error('Erro ao enviar avaliação');
      
      // Lógica de Redirecionamento Híbrido
      if (rating >= (settings?.min_rating_for_google || 4)) {
        if (settings?.enable_google_review && settings?.google_review_url) {
           window.location.href = settings.google_review_url;
           return;
        }
      } else {
        if (settings?.feedback_type === 'external_forms' && settings?.external_forms_url) {
           window.location.href = settings.external_forms_url;
           return;
        }
      }

      setSubmitted(true);
    } catch (err) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return (
     <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 text-center">
        <Card className="w-full max-w-md bg-white border-[#E5E0D8] shadow-2xl rounded-3xl p-8">
             <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 font-serif">
                <CheckCircle2 className="h-8 w-8" />
             </div>
             <h1 className="text-2xl font-bold text-[#2C2825] mb-2 font-serif">Obrigado!</h1>
             <p className="text-[#5C5855]">Sua avaliação é muito importante para nós e foi registrada internamente.</p>
        </Card>
     </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 font-sans">
       <Card className="w-full max-w-md bg-white border-[#E5E0D8] shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95">
          <CardContent className="p-8 text-center space-y-6">
             <div>
                <h1 className="text-2xl font-bold text-[#2C2825] font-serif">Avalie seu Atendimento</h1>
                <p className="text-[#5C5855] mt-2">Sua opinião é fundamental para nossa excelência.</p>
             </div>

             <div className="flex justify-center gap-3 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                   <button
                     key={star}
                     onClick={() => setRating(star)}
                     className={`transition-all hover:scale-125 duration-300 ${rating >= star ? 'text-[#D4AF37]' : 'text-[#E5E0D8]'}`}
                   >
                      <Star className={`h-12 w-12 ${rating >= star ? 'fill-[#D4AF37]' : ''}`} />
                   </button>
                ))}
             </div>

             <div className="space-y-4">
                <TextArea 
                    placeholder="Gostaria de deixar um comentário? (Opcional)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="bg-[#FAF9F6] border-[#E5E0D8] min-h-[120px] rounded-xl focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                />
             </div>

             <Button 
               onClick={handleSubmit}
               loading={submitting}
               className="w-full h-14 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-2xl shadow-lg shadow-[#D4AF37]/30 transition-all active:scale-95"
             >
                Confirmar Avaliação
             </Button>

             {rating >= 4 && settings?.enable_google_review && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Após confirmar, você poderá nos avaliar no Google
                </p>
             )}
          </CardContent>
       </Card>
    </div>
  );
}
