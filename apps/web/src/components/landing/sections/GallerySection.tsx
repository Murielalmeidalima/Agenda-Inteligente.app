'use client';

export function GallerySection() {
  return (
    <section className="py-24 px-4 bg-[#2C2825] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-serif">A interface mais bonita do mercado</h2>
          <p className="text-slate-400 text-xl">Pensada para ser simples, rápida e agradável de usar todos os dias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Screenshot */}
          <div className="md:col-span-8 relative bg-slate-800 rounded-3xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center">
             <div className="text-center text-slate-500">
               <p className="font-bold">[ESPAÇO PARA TELA DA AGENDA OU PRONTUÁRIO]</p>
             </div>
          </div>
          
          {/* Side Mobile Screenshot */}
          <div className="md:col-span-4 relative bg-slate-800 rounded-3xl overflow-hidden aspect-[9/16] md:aspect-auto border border-slate-700 flex items-center justify-center">
            <div className="text-center text-slate-500 px-4">
               <p className="font-bold">[ESPAÇO PARA TELA DO MOBILE APP]</p>
             </div>
          </div>

          {/* Bottom small screenshots */}
          <div className="md:col-span-4 relative bg-slate-800 rounded-3xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center">
             <div className="text-center text-slate-500 px-4">
               <p className="font-bold text-sm">[ESPAÇO PARA TELA FINANCEIRO]</p>
             </div>
          </div>
          <div className="md:col-span-4 relative bg-slate-800 rounded-3xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center">
             <div className="text-center text-slate-500 px-4">
               <p className="font-bold text-sm">[ESPAÇO PARA AUTOMAÇÕES]</p>
             </div>
          </div>
          <div className="md:col-span-4 relative bg-slate-800 rounded-3xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center">
             <div className="text-center text-slate-500 px-4">
               <p className="font-bold text-sm">[ESPAÇO PARA ESTOQUE]</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
