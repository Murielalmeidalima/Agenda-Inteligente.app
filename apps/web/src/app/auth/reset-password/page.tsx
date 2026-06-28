'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input, Badge } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, Lock, ShieldCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';


export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      console.error('Update password error:', err);
      setError('Erro ao atualizar senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
       {/* Glassmorphism Card */}
       <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

          <div className="px-8 sm:px-12 py-12 relative z-10">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-6">
                 <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#F0EBE0]/50">
                    <LogoImage size={64} />
                 </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Nova Senha</h1>
              <p className="text-[#5C5855] text-sm leading-relaxed">
                Defina uma senha forte para proteger seu ambiente.
              </p>
            </div>

            {success ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-center shadow-sm backdrop-blur-sm">
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                     <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white">
                        <CheckCircle2 className="h-5 w-5" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-lg font-bold text-[#2C2825]">Senha Redefinida!</h3>
                     <p className="text-[#5C5855] text-xs leading-relaxed">
                        Sua senha foi atualizada com sucesso. Redirecionando para o login...
                     </p>
                  </div>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleUpdatePassword}>
                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50/90 border border-red-100 p-3 text-xs text-red-600 animate-shake text-left shadow-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Confirmar Senha</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white font-bold text-base rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? (
                     <span>Atualizando...</span>
                  ) : (
                     <span className="flex items-center gap-2">
                        Atualizar Senha
                        <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                     </span>
                  )}
                </Button>
              </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-[#E5E0D8]/50 flex flex-col items-center gap-2">
               <p className="text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70">
                 Segurança de ponta a ponta
               </p>
            </div>
          </div>
       </div>
    </AnimatedBackground>
  );
}
