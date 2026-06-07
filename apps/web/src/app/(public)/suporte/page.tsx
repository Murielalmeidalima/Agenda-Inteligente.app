'use client';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { FooterSection } from '@/components/landing/sections/FooterSection';
import { Card, Button, Input } from '@projeto/ui';
import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [sent, setSent] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    // Future integration with API
    setTimeout(() => setSent(false), 5000);
  };

  const faqs = [
    { q: "Como criar um agendamento?", a: "Acesse o painel 'Agenda', selecione o horário desejado, clique no slot vazio e escolha o cliente e o procedimento." },
    { q: "Como cadastrar um cliente?", a: "Vá no menu 'Clientes' > 'Novo Cliente', preencha os dados e os consentimentos obrigatórios." },
    { q: "Como alterar minha assinatura?", a: "Acesse as 'Configurações' > 'Assinatura' para fazer upgrade, downgrade ou atualizar a forma de pagamento." },
    { q: "Como redefinir minha senha?", a: "Na tela de Login, clique em 'Esqueci minha senha' e você receberá um link seguro de recuperação no seu e-mail." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2825]">
      <PublicNavbar />
      
      <main className="pt-32 pb-24 px-4 max-w-7xl mx-auto">
        {/* Header Support */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-6 font-serif text-[#2C2825]">Como podemos ajudar?</h1>
          <p className="text-xl text-[#5C5855]">Nossa equipe está pronta para ajudar você a aproveitar ao máximo o Agenda Inteligente.</p>
        </div>

        {/* Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="space-y-8">
            <Card className="p-8 border-2 border-[#E5E0D8] bg-white rounded-3xl flex items-start gap-6 hover:border-[#D4AF37]/50 transition-colors">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 text-emerald-500">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Atendimento via WhatsApp</h3>
                <p className="text-[#5C5855] mb-4">Para suporte rápido, faturamento ou dúvidas operacionais urgentes.</p>
                <a href="#" className="font-bold text-emerald-600 hover:underline">Iniciar conversa no WhatsApp &rarr;</a>
              </div>
            </Card>

            <Card className="p-8 border-2 border-[#E5E0D8] bg-white rounded-3xl flex items-start gap-6 hover:border-[#D4AF37]/50 transition-colors">
              <div className="w-14 h-14 bg-[#FAF6E9] rounded-2xl flex items-center justify-center shrink-0 text-[#D4AF37]">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Atendimento por E-mail</h3>
                <p className="text-[#5C5855] mb-4">Para envio de comprovantes, solicitações formais de privacidade ou exclusão de conta.</p>
                <a href="mailto:suporte@agendainteligente.com.br" className="font-bold text-[#D4AF37] hover:underline">suporte@agendainteligente.com.br</a>
              </div>
            </Card>

            <div className="flex items-center gap-4 text-[#5C5855] p-4 bg-[#FAF9F6] rounded-2xl border border-[#E5E0D8]/50">
              <Clock className="w-6 h-6 text-[#A8A49D]" />
              <div>
                <p className="font-bold text-[#2C2825]">Horário de Atendimento</p>
                <p className="text-sm">Segunda a Sexta, das 08:00 às 18:00</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="p-8 md:p-10 border border-[#E5E0D8] bg-white rounded-3xl shadow-xl shadow-black/5">
            <h3 className="text-2xl font-bold mb-6">Envie uma mensagem</h3>
            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-xl text-center">
                <p className="font-bold text-lg mb-2">Mensagem enviada!</p>
                <p>Nossa equipe responderá em breve através do e-mail informado.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8A847C] uppercase tracking-wider">Nome</label>
                    <Input required placeholder="Seu nome" className="bg-[#FAF9F6] border-[#E5E0D8]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8A847C] uppercase tracking-wider">Clínica</label>
                    <Input required placeholder="Nome da empresa" className="bg-[#FAF9F6] border-[#E5E0D8]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A847C] uppercase tracking-wider">E-mail</label>
                  <Input required type="email" placeholder="seu@email.com" className="bg-[#FAF9F6] border-[#E5E0D8]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A847C] uppercase tracking-wider">Assunto</label>
                  <Input required placeholder="Do que você precisa?" className="bg-[#FAF9F6] border-[#E5E0D8]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A847C] uppercase tracking-wider">Mensagem</label>
                  <textarea required rows={4} className="w-full rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] p-3 text-sm focus:ring-2 focus:ring-[#D4AF37] focus:outline-none" placeholder="Detalhe sua dúvida ou problema..."></textarea>
                </div>
                <Button type="submit" className="w-full h-12 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl mt-4">
                  Enviar Mensagem
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#2C2825]">Dúvidas Rápidas (FAQ)</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-[#E5E0D8] rounded-2xl bg-white [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:border-[#D4AF37]/30">
                <summary className="flex items-center justify-between p-6 font-bold text-[#2C2825] outline-none">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-[#5C5855]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* System Status (Future Proof) */}
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
           <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistemas Operacionais
           </div>
           <p className="text-slate-500 text-sm">Todos os servidores, disparo de WhatsApp e Gateway de pagamento estão operando normalmente.</p>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
}
