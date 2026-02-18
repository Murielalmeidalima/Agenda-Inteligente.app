'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input, Badge } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground'; // Importar


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard/schedule');
      }
    };
    checkSession();
  }, [router]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Insira um endereço de e-mail válido.');
      return false;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const supabase = createBrowserClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
           throw new Error('E-mail ou senha incorretos.');
        } else if (signInError.message.includes('Email not confirmed')) {
           throw new Error('Por favor, confirme seu e-mail antes de entrar.');
        } else {
           throw new Error(signInError.message);
        }
      }

      // --- NEW: Check for Admin Approval (Robust) ---
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
         let profile = null;
         let attempts = 0;
         
         // Retry loop to handle trigger latency
         while (attempts < 3 && !profile) {
            const { data, error: profileError } = await supabase
               .from('profiles')
               .select('approved, role')
               .eq('id', user.id)
               .maybeSingle();

            if (!profileError && data) {
               profile = data;
               break;
            }
            
            // console.log(`Attempt ${attempts + 1}: Profile not found yet, retrying...`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            attempts++;
         }

         if (!profile) {
            console.error('Profile check failed after retries. User ID:', user.id);
            // Verify if it is really a permissions issue or missing profile
            await supabase.auth.signOut();
            throw new Error('Perfil de usuário não encontrado. Entre em contato com o suporte.');
         }

         if (!profile.approved) {
            await supabase.auth.signOut();
            throw new Error('Acesso pendente de aprovação pelo administrador.');
         }
      }
      // -------------------------------------
      // -------------------------------------

      setSuccess('Login realizado com sucesso! Redirecionando...');
      
      setTimeout(() => {
         router.push('/dashboard/schedule');
         router.refresh();
      }, 800);

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Ocorreu um erro ao fazer login.');
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
              
              <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Bem-vindo de volta</h1>
              <p className="text-[#5C5855] text-sm leading-relaxed">
                Acesse seu painel para gerenciar sua clínica.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin} noValidate>
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50/90 border border-red-100 p-3 text-xs text-red-600 animate-shake shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              {success && (
                 <div className="flex items-center gap-3 rounded-xl bg-emerald-50/90 border border-emerald-100 p-3 text-xs text-emerald-600 animate-fade-in shadow-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="font-medium">{success}</span>
                 </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-1 group">
                  <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@clinica.com"
                      className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-1 group">
                  <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="peer w-4 h-4 rounded border-[#D1CDC7] bg-white text-[#D4AF37] focus:ring-[#D4AF37]/50 transition-all checked:bg-[#D4AF37] checked:border-[#D4AF37]" />
                  </div>
                  <span className="text-[#5C5855] group-hover:text-[#2C2825] transition-colors">Lembrar-me</span>
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline"
                >
                  Recuperar senha
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold text-base rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                loading={loading}
                disabled={loading || !!success}
              >
                {loading ? (
                   <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Autenticando...
                   </span>
                ) : success ? (
                   <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Sucesso
                   </span>
                ) : (
                   <span className="flex items-center gap-2">
                      Entrar na Plataforma
                      <ArrowRight className="h-4 w-4 opacity-90 group-hover:translate-x-1 transition-transform" />
                   </span>
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-[#E5E0D8]/50 flex flex-col items-center gap-4">
               <p className="text-[#8A847C] text-xs">
                 Ainda não tem uma conta?{' '}
                 <Link 
                   href="/auth/register" 
                   className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline"
                 >
                   Inicie seu teste gratuito
                 </Link>
               </p>
               
               <p className="text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70">
                 © 2026 Agenda Inteligente
               </p>
            </div>
          </div>
       </div>
    </AnimatedBackground>
  );
}
