'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@projeto/ui';
import { Smartphone, Clock, Sparkles, Check } from 'lucide-react';

export function WhatsAppFallback() {
  const upcomingFeatures = [
    'Lembretes automáticos',
    'Confirmações de consulta',
    'Campanhas de marketing',
    'Mensagens de aniversário',
    'Notificações inteligentes',
    'Automações personalizadas',
  ];

  return (
    <div className="w-full flex items-center justify-center py-6 px-4 animate-fade-in">
      <Card className="max-w-2xl w-full border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-2xl shadow-slate-100 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-slate-200/80">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 px-8 py-7 text-center md:text-left flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600 animate-pulse">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
              🚧 Integração com WhatsApp
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              Esta funcionalidade está em desenvolvimento e em breve será disponibilizada em uma nova versão do Agenda Inteligente.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 py-10 bg-white/40">
          <div className="max-w-md mx-auto text-center md:text-left space-y-6">
            <p className="text-slate-600 font-medium leading-relaxed">
              Estamos preparando uma integração oficial com a API do WhatsApp Business para oferecer uma experiência de comunicação de alto nível para a sua clínica:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {upcomingFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:border-slate-200/80 hover:translate-y-[-1px] group"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
              <Badge className="bg-slate-900/5 text-slate-500 border-none font-bold uppercase tracking-wider text-[10px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                Novidades a Caminho
              </Badge>
              <p className="text-xs font-bold text-slate-400">
                Agradecemos sua compreensão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
