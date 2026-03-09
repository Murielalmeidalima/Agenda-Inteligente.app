'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '@projeto/ui';
import { Star, TrendingUp, Calendar, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';

export function ReviewsWidget() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // 1. Buscar métricas agrupadas (seria ideal via RPC, mas faremos no client para simplicidade inicial)
      const { data: allReviews } = await supabase
        .from('appointment_reviews')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (allReviews) {
        // Agrupar por Mês/Ano
        const grouped = allReviews.reduce((acc: any, review) => {
          const key = `${review.review_year}-${String(review.review_month).padStart(2, '0')}`;
          if (!acc[key]) {
            acc[key] = {
              month: review.review_month,
              year: review.review_year,
              total: 0,
              sum: 0,
              reviews: []
            };
          }
          acc[key].total += 1;
          acc[key].sum += review.rating;
          acc[key].reviews.push(review);
          return acc;
        }, {});

        const statsArray = Object.values(grouped).sort((a: any, b: any) => 
          b.year !== a.year ? b.year - a.year : b.month - a.month
        );

        setStats(statsArray);
        setReviews(allReviews.slice(0, 5)); // Mostrar as 5 últimas no geral
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Carregando métricas...</div>;

  if (stats.length === 0) return (
    <Card className="bg-muted/10 border-dashed border-2">
      <CardContent className="py-12 text-center text-muted-foreground">
         <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
         <p>Nenhuma avaliação recebida até o momento.</p>
      </CardContent>
    </Card>
  );

  const currentMonth = stats[currentIndex];
  const avgRating = (currentMonth.sum / currentMonth.total).toFixed(1);
  const monthName = new Date(currentMonth.year, currentMonth.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 overflow-hidden relative group">
          <div className="absolute top-4 right-4 flex gap-2">
             <button 
                onClick={() => setCurrentIndex(prev => Math.min(stats.length - 1, prev + 1))}
                disabled={currentIndex === stats.length - 1}
                className="p-1 rounded-full hover:bg-primary/20 disabled:opacity-30 transition-colors"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-1 rounded-full hover:bg-primary/20 disabled:opacity-30 transition-colors"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>
          
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
               <Calendar className="w-3 h-3" />
               {monthName}
            </div>
            <CardTitle className="text-2xl font-serif">Métricas Mensais</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-7xl font-bold text-primary font-serif drop-shadow-sm">{avgRating}</div>
            <div className="flex gap-1.5 my-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-6 h-6 ${s <= Math.round(Number(avgRating)) ? 'fill-primary text-primary' : 'text-primary/20'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
               <TrendingUp className="w-4 h-4 text-emerald-500" />
               {currentMonth.total} avaliações no mês
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4 border-[#E5E0D8]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif">Últimos Feedbacks</CardTitle>
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-[#F5F2EF] pb-4 last:border-0 last:pb-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-sm text-[#2C2825]">Cliente</h4>
                         <span className="text-[10px] text-muted-foreground uppercase">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-[#5C5855] italic leading-relaxed">"{review.comment || 'Sem comentário'}"</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-neutral-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {stats.slice(0, 4).map((m, idx) => (
            <Card key={idx} className={cn("bg-card transition-all cursor-pointer hover:border-primary", currentIndex === idx && "ring-2 ring-primary border-transparent")}>
               <CardContent className="p-4 py-6 text-center" onClick={() => setCurrentIndex(idx)}>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    {new Date(m.year, m.month - 1).toLocaleDateString('pt-BR', { month: 'short' })} {m.year}
                  </p>
                  <p className="text-2xl font-serif font-bold text-primary">{(m.sum / m.total).toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">{m.total} feedbacks</p>
               </CardContent>
            </Card>
         ))}
      </div>
    </div>
  );
}
