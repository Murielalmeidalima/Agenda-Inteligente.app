'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Lock, Mail, Loader2, CheckCircle2, MailCheck } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';

type SpecialState = null | 'email_not_confirmed' | 'pending_approval';

// ─── Componente interno que usa useSearchParams ───────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [specialState, setSpecialState] = useState<SpecialState>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Erros vindos da URL (redirect do middleware)
  useEffect(() => {
    const urlError = searchParams?.get('error');
    if (urlError === 'pending_approval') {
      setError('Seu acesso ainda está pendente de aprovação pelo administrador.');
      setSpecialState('pending_approval');
    } else if (urlError === 'no_profile') {
      setError('Perfil não encontrado. Entre em contato com o suporte.');
    } else if (urlError === 'no_company') {
      setError('Nenhuma empresa vinculada ao seu perfil. Entre em contato com o suporte.');
    }
  }, [searchParams]);

  // Limpar sessão existente se entrar na tela de login por segurança
  useEffect(() => {
    const clearSession = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[AUTH][LOGIN] Sessão ativa detectada na tela de login. Forçando logout...');
        await supabase.auth.signOut();
        router.refresh();
      }
    };
    clearSession();
  }, [router]);

  const validateForm = () => {
    if (!email || !password) { setError('Por favor, preencha todos os campos.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Insira um endereço de e-mail válido.'); return false; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return false; }
    return true;
  };

  const handleResendConfirmation = async () => {
    if (!email) { setError('Insira seu e-mail para reenviar a confirmação.'); return; }
    setResendingEmail(true);
    setError('');
    try {
      const supabase = createBrowserClient();
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) {
        if (resendError.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos.');
        throw new Error('Não foi possível reenviar o e-mail.');
      }
      setResendSuccess(true);
      setSpecialState(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendingEmail(false);
    }
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSpecialState(null);
    setResendSuccess(false);

    if (!validateForm()) return;
    setLoading(true);
    console.log('[AUTH][LOGIN] Iniciando autenticação...');

    try {
      const supabase = createBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        console.error('[AUTH][LOGIN] Erro:', signInError.message);
        if (signInError.message === 'Invalid login credentials' || signInError.message?.includes('invalid_credentials')) {
          throw new Error('E-mail ou senha incorretos.');
        }
        if (signInError.message?.includes('Email not confirmed') || signInError.message?.includes('email_not_confirmed')) {
          setSpecialState('email_not_confirmed');
          throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
        }
        if (signInError.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos.');
        throw new Error(signInError.message || 'Falha na autenticação.');
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let profile = null;
        for (let i = 0; i < 3; i++) {
          const { data: pd } = await supabase.from('profiles').select('approved, role, company_id').eq('id', user.id).maybeSingle();
          if (pd) { profile = pd; break; }
          await new Promise(r => setTimeout(r, 1000));
        }

        if (!profile) {
          await supabase.auth.signOut();
          throw new Error('Perfil não encontrado. Entre em contato com o suporte.');
        }

        console.log('[AUTH][LOGIN] Perfil:', { approved: profile.approved, role: profile.role });

        if (!profile.approved) {
          await supabase.auth.signOut();
          setSpecialState('pending_approval');
          throw new Error('Acesso pendente de aprovação pelo administrador.');
        }
        if (!profile.company_id) {
          await supabase.auth.signOut();
          throw new Error('Nenhuma empresa vinculada. Entre em contato com o suporte.');
        }

        // 📝 Registrar Log de Acesso
        try {
          await supabase.from('employee_access_logs').insert({
            company_id: profile.company_id,
            profile_id: user.id,
            action: 'login',
            resource: 'system',
            details: { method: 'password', role: profile.role }
          });
          
          // Atualizar last_access no perfil
          await supabase.from('profiles').update({ last_access: new Date().toISOString() }).eq('id', user.id);
        } catch (logErr) {
          console.error('[AUTH][LOG] Erro ao registrar acesso:', logErr);
        }
      }

      console.log('[AUTH][LOGIN] ✅ Sucesso!');
      router.push('/dashboard/schedule');
    } catch (err: any) {
      console.error('[AUTH][LOGIN] ❌', err.message);
      setError(err.message || 'Ocorreu um erro ao fazer login.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

      <div className="px-8 sm:px-12 py-12 relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <LogoImage size={80} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Bem-vindo</h1>
          <p className="text-[#5C5855] text-sm leading-relaxed">Acesse seu painel para gerenciar sua clínica.</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin} noValidate>
          {resendSuccess && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50/90 border border-blue-100 p-3 text-xs text-blue-700 shadow-sm">
              <MailCheck className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="font-medium">E-mail de confirmação reenviado! Verifique sua caixa de entrada.</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50/90 border border-red-100 p-3 shadow-sm">
              <div className="flex items-center gap-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
              {specialState === 'email_not_confirmed' && (
                <button type="button" onClick={handleResendConfirmation} disabled={resendingEmail || !email}
                  className="mt-2 w-full text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center justify-center gap-1 disabled:opacity-50">
                  {resendingEmail ? <><Loader2 className="h-3 w-3 animate-spin" /> Reenviando...</> : <><MailCheck className="h-3 w-3" /> Reenviar e-mail de confirmação</>}
                </button>
              )}
              {specialState === 'pending_approval' && (
                <p className="mt-2 text-xs text-red-500 text-center">Entre em contato com o administrador para liberar seu acesso.</p>
              )}
            </div>
          )}



          <div className="space-y-4">
            <div className="space-y-1 group">
              <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                <Input id="email" type="email" autoComplete="email" placeholder="voce@clinica.com"
                  className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                  required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                  className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                  required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input type="checkbox" className="peer w-4 h-4 rounded border-[#D1CDC7] bg-white text-[#D4AF37] focus:ring-[#D4AF37]/50 transition-all checked:bg-[#D4AF37] checked:border-[#D4AF37]" />
              <span className="text-[#5C5855] group-hover:text-[#2C2825] transition-colors">Lembrar-me</span>
            </label>
            <Link href="/auth/forgot-password" className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline">Recuperar senha</Link>
          </div>

          <div className="space-y-3 pt-1">
            <Button type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold text-base rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              loading={loading} disabled={loading || !!success}>
              {loading ? <span>Autenticando...</span>
                : success ? <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Sucesso</span>
                  : <span className="flex items-center gap-2">Entrar na Plataforma<ArrowRight className="h-4 w-4 opacity-90" /></span>}
            </Button>


          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E5E0D8]/50 flex flex-col items-center gap-4">
          <p className="text-[#8A847C] text-xs">
            Ainda não tem uma conta?{' '}
            <Link href="/auth/register" className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline">Inicie seu teste gratuito</Link>
          </p>
          <p className="text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70">© 2026 Agenda Inteligente</p>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal com Suspense obrigatório para useSearchParams ───────────
export default function LoginPage() {
  return (
    <AnimatedBackground>
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AnimatedBackground>
  );
}
