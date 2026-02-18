'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@projeto/ui';
import { Star } from 'lucide-react';

export function ReviewsWidget() {
  // Mock Data
  const averageRating = 4.8;
  const totalReviews = 124;
  const reviews = [
    { id: 1, user: 'Maria Silva', rating: 5, comment: 'Adorei o atendimento! Profissional excelente.', date: 'Hoje' },
    { id: 2, user: 'João Santos', rating: 4, comment: 'Muito bom, mas atrasou um pouco.', date: 'Ontem' },
    { id: 3, user: 'Ana Costa', rating: 5, comment: 'Resultado incrível, volto com certeza.', date: '2 dias atrás' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-3 bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>NPS & Satisfação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="text-5xl font-bold text-primary font-serif">{averageRating}</div>
          <div className="flex gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{totalReviews} avaliações totais</p>
        </CardContent>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Últimos Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm">{review.user}</h4>
                    <p className="text-xs text-muted-foreground">{review.comment}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-primary text-primary' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{review.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
