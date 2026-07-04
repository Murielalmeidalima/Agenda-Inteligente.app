'use client';

import { MessageSquare, Mail, Phone, ArrowUpRight } from 'lucide-react';

const notifications = [
  {
    icon: MessageSquare,
    name: 'WhatsApp Oficial',
    desc: 'Confirmações automáticas, lembretes de consultas e mensagens de retorno direto no celular do cliente.',
    badge: 'Ativo',
    color: '#25D366',
  },
  {
    icon: Mail,
    name: 'E-mails de Alta Entrega',
    desc: 'Envio seguro de anamneses, termos de consentimento e comunicados importantes de forma instantânea.',
    badge: 'Comunicação',
    color: '#000000',
  },
  {
    icon: Phone,
    name: 'SMS de Segurança',
    desc: 'Canal alternativo de alta prioridade para garantir o recebimento de avisos urgentes e senhas.',
    badge: 'Backup',
    color: '#D4AF37',
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
      {/* Decorações sutis de fundo */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFF0F2] rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto font-sans">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            COMUNICAÇÃO E ALERTAS
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif leading-tight">
            Notificações e Avisos Automatizados
          </h2>
          <p className="text-[#5C5855] text-base sm:text-lg max-w-2xl mx-auto">
            O Agenda Inteligente conta com canais de disparo automático para manter seus clientes informados e reduzir as faltas na sua agenda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {notifications.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 bg-white border border-[#FAF6F0] rounded-[2rem] shadow-[0_4px_20px_rgba(44,40,37,0.02)] hover:shadow-[0_20px_40px_rgba(44,40,37,0.06)] hover:border-[#D4AF37]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#FAF6F0] text-[#2C2825] rounded-full border border-[#FAF6F0] group-hover:border-[#D4AF37]/20 transition-all duration-300">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#2C2825] font-serif mb-3 flex items-center gap-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#5C5855] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#FAF6F0] flex items-center text-xs font-bold text-[#2C2825] group-hover:text-[#D4AF37] transition-colors">
                  Saiba mais sobre o recurso
                  <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
