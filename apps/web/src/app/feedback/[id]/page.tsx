'use client';

import { useState } from 'react';

import { Star } from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  TextArea as Textarea 
} from '@projeto/ui';
import { cn } from '@projeto/ui'; // cn is exported from ui root

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Mock fetching appointment details based on params.id
  // In real app, fetch from Supabase
  const clientName = "Cliente"; 

  const handleSubmit = () => {
    // Logic to save review to Supabase
    /*
    await supabase.from('reviews').insert({
      appointment_id: params.id,
      rating,
      comment
    });
    */
// console.log('Submitted:', { id: params.id, rating, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-serif">
        <Card className="w-full max-w-md bg-white shadow-xl border-none">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-[#2C2825]">Obrigado pela avaliação!</h2>
            <p className="text-[#5C5855]">Sua opinião é muito importante para nós.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl border-none">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-serif font-bold text-[#2C2825]">Como foi seu atendimento?</CardTitle>
          <CardDescription className="text-[#5C5855]">
            Olá {clientName}, avalie sua experiência na Agenda Inteligente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors duration-200",
                    (hoveredRating || rating) >= star 
                      ? "fill-[#D4AF37] text-[#D4AF37]" 
                      : "text-gray-300"
                  )} 
                />
              </button>
            ))}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2C2825]">Deixe um comentário (opcional)</label>
            <Textarea 
              placeholder="O que você achou do serviço?" 
              className="resize-none border-[#D6D1C7] focus:ring-[#D4AF37]"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0}
            className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-[#2C2825] font-bold"
          >
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
