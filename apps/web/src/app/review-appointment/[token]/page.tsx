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
      
      setSubmitted(true);
    } catch (err) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return (
     <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
        <Card className="w-full max-w-md bg-white border-[#E5E0D8] shadow-2xl rounded-3xl p-8 text-center">
             <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                <CheckCircle2 className="h-8 w-8" />
             </div>
             <h1 className="text-2xl font-bold text-[#2C2825] mb-2">Obrigado!</h1>
             <p className="text-[#5C5855]">Sua avaliação é muito importante para nós.</p>
        </Card>
     </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 font-sans">
       <Card className="w-full max-w-md bg-white border-[#E5E0D8] shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
             <div>
                <h1 className="text-2xl font-bold text-[#2C2825]">Avalie seu Atendimento</h1>
                <p className="text-[#5C5855] mt-2">Como foi sua experiência conosco?</p>
             </div>

             <div className="flex justify-extreme gap-2 justify-center py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                   <button
                     key={star}
                     onClick={() => setRating(star)}
                     className={`transition-all hover:scale-110 ${rating >= star ? 'text-[#D4AF37]' : 'text-[#E5E0D8]'}`}
                   >
                      <Star className="h-10 w-10 fill-current" />
                   </button>
                ))}
             </div>

             <TextArea 
                placeholder="Gostaria de deixar um comentário? (Opcional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="bg-[#FAF9F6] border-[#E5E0D8] min-h-[100px] rounded-xl"
             />

             <Button 
               onClick={handleSubmit}
               loading={submitting}
               className="w-full h-12 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl shadow-lg shadow-[#D4AF37]/20"
             >
                Enviar Avaliação
             </Button>
          </CardContent>
       </Card>
    </div>
  );
}
