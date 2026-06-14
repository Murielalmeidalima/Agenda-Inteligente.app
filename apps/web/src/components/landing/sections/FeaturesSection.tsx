'use client';
import { Calendar, TrendingUp, Package, Users, FileCheck2, MessageSquareShare, BellRing, Bot, Smartphone, BarChart3 } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    { icon: Calendar, title: 'Agenda Inteligente', desc: 'Controle de horários, salas e profissionais com visão unificada e sem conflitos.' },
    { icon: TrendingUp, title: 'Financeiro Completo', desc: 'Fluxo de caixa, contas a pagar/receber, DRE e controle de inadimplência.' },
    { icon: Package, title: 'Estoque Integrado', desc: 'Baixa automática de insumos, alertas de reposição e controle de validade.' },
    { icon: Bot, title: 'Marketing Automático', desc: 'Campanhas de reengajamento, aniversariantes e clientes inativos no automático.' },
    { icon: Users, title: 'Gestão de Equipe', desc: 'Permissões de acesso, comissões por profissional e auditoria de acessos.' },
    { icon: FileCheck2, title: 'Anamnese Digital', desc: 'Prontuário eletrônico seguro com fotos, assinatura digital e histórico.' },
    { icon: MessageSquareShare, title: 'WhatsApp Automatizado', desc: 'Lembretes de consulta, confirmações e campanhas direto no WhatsApp.' },
    { icon: BellRing, title: 'Avaliações Automáticas', desc: 'Solicite avaliações no Google automaticamente após cada atendimento.' },
    { icon: Smartphone, title: 'Acesso Mobile', desc: 'Use de qualquer lugar, do celular ou tablet, com interface 100% responsiva.' },
    { icon: BarChart3, title: 'Relatórios e Metas', desc: 'Dashboards visuais, metas mensais e relatórios gerenciais para decisões.' },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-4 bg-[#fff8f8] relative">
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-[#d9a5b3]/10 blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto font-sans">
        <div className="text-center mb-14">
          <span className="text-[#7d525f] font-bold tracking-widest uppercase text-sm mb-3 block">
            A SOLUÇÃO
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#1f1a1b] font-playfair-display">
            Tudo em um só lugar
          </h2>
          <p className="text-[#504446] text-lg md:text-xl">
            Mais de 10 módulos integrados para escalar a operação da sua clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-white border border-[#d4c2c5]/30 rounded-3xl hover:border-[#c97d95]/40 hover:shadow-[0_12px_32px_rgba(201,125,149,0.03)] hover:-translate-y-1 transition-all duration-300 group cursor-default"
              >
                <div className="w-11 h-11 bg-[#f5ecec] rounded-xl flex items-center justify-center mb-4 text-[#7d525f] group-hover:bg-[#7d525f] group-hover:text-white transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold mb-1.5 text-[#1f1a1b] font-playfair-display">{feat.title}</h3>
                <p className="text-[#504446] text-xs leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
