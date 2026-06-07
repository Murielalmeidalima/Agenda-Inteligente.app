'use client';

export function FAQSection() {
  const faqs = [
    {
      q: "Funciona no celular?",
      a: "Sim! Nossa plataforma é 100% responsiva e possui um PWA que você pode instalar diretamente na tela inicial do seu celular, funcionando até offline."
    },
    {
      q: "Preciso instalar algum programa no computador?",
      a: "Não. O Agenda Inteligente roda totalmente na nuvem. Basta acessar pelo navegador de qualquer computador, tablet ou celular."
    },
    {
      q: "Como funciona o teste grátis?",
      a: "Você tem acesso completo à plataforma. Pode cadastrar clientes, usar a agenda e ver como tudo funciona na prática, sem compromisso."
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Com certeza. Não temos contrato de fidelidade ou multas rescisórias. Você cancela com um clique direto no painel."
    },
    {
      q: "Meus dados ficam seguros?",
      a: "Sim. Utilizamos servidores seguros da AWS e Supabase, com criptografia de ponta a ponta e backups automáticos diários. Só você tem acesso aos dados da sua clínica."
    }
  ];

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif">Perguntas Frequentes</h2>
          <p className="text-[#5C5855] text-xl">Tudo o que você precisa saber antes de assinar.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-[#E5E0D8] rounded-2xl bg-[#FAF9F6] [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between p-6 font-bold text-[#2C2825] text-lg outline-none">
                {faq.q}
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-[#5C5855] leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
