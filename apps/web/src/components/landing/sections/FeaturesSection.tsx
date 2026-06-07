'use client';
import { Calendar, TrendingUp, Package, ShieldCheck, Smartphone, Users, MessageSquareShare, FileCheck2, Bot, BellRing } from 'lucide-react';
import { Card } from '@projeto/ui';

export function FeaturesSection() {
  const features = [
    { icon: <Calendar className="w-6 h-6" />, title: "Agenda Inteligente", desc: "Controle de horários, salas e profissionais em uma visão única." },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Financeiro Completo", desc: "Fluxo de caixa, contas a pagar, comissões e DRE automático." },
    { icon: <Package className="w-6 h-6" />, title: "Estoque Integrado", desc: "Baixa automática no uso de insumos e alertas de reposição." },
    { icon: <Bot className="w-6 h-6" />, title: "Automações", desc: "Criação de fluxos automáticos de marketing e lembretes." },
    { icon: <Users className="w-6 h-6" />, title: "Gestão de Equipe", desc: "Permissões de acesso e comissionamento por profissional." },
    { icon: <FileCheck2 className="w-6 h-6" />, title: "Anamnese Digital", desc: "Prontuário eletrônico seguro com assinatura e anexos." },
    { icon: <MessageSquareShare className="w-6 h-6" />, title: "WhatsApp Connect", desc: "Envie lembretes e mensagens diretamente pelo sistema." },
    { icon: <BellRing className="w-6 h-6" />, title: "Captação de Avaliações", desc: "Peça feedback no Google pós-consulta automaticamente." }
  ];

  return (
    <section id="features" className="py-24 px-4 bg-white relative">
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-[#D4AF37]/5 blur-[100px] -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mb-2 block">A SOLUÇÃO</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif">Tudo em um só lugar</h2>
          <p className="text-[#5C5855] text-xl">Mais de 10 módulos integrados para escalar a sua operação.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <Card key={idx} className="p-6 border border-[#E5E0D8]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 bg-[#FAF6E9] rounded-xl flex items-center justify-center mb-4 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#2C2825]">{feat.title}</h3>
              <p className="text-[#8A847C] text-sm leading-relaxed">{feat.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
