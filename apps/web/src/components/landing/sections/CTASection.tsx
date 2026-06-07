'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@projeto/ui';

export function CTASection() {
  return (
    <section className="py-32 px-4 bg-[#D4AF37] relative overflow-hidden text-center text-white">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-3xl rounded-full" />

      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight font-serif drop-shadow-md">
          Pare de perder tempo e dinheiro. Comece hoje a organizar sua clínica.
        </h2>
        <p className="text-xl md:text-2xl mb-12 text-white/90 font-medium">
          O controle total do seu negócio está a um clique de distância.
        </p>
        <Link href="/auth/register">
          <Button size="lg" className="h-20 px-16 text-2xl bg-white hover:bg-slate-50 text-[#D4AF37] shadow-2xl hover:shadow-white/20 group rounded-[2rem] font-black transition-all hover:scale-105 active:scale-95">
            TESTAR GRÁTIS AGORA
            <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-2 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
