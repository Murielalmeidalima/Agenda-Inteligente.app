'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input, Badge } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowRight, Building, User, Mail, Lock, Loader2 } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      let userId: string;

      // ─── Etapa 1: Criar usuário no Auth ────────────────────────────────────
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        // Usuário já existe mas o cadastro ficou incompleto (sem empresa/perfil)
        // Tenta fazer login para completar o setup
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
          console.log('[REGISTER] Usuário já existe, tentando completar cadastro...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (signInError) {
            setError('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
            setLoading(false);
            return;
          }
          userId = signInData.user!.id;
        } else {
          setError('Erro ao criar conta: ' + signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        if (!authData.user) {
          setError('Erro ao criar usuário. Tente novamente.');
          setLoading(false);
          return;
        }
        userId = authData.user.id;
      }

      // ─── Etapa 2: Verificar se já tem empresa/perfil ────────────────────────
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile?.company_id) {
        // Tudo já está configurado — ir para o sucesso
        console.log('[REGISTER] Perfil já existe e está completo.');
        setSuccess(true);
        return;
      }

      // ─── Etapa 3: Criar empresa ─────────────────────────────────────────────
      // INSERT separado do SELECT para não acionar a policy SELECT que causa recursão
      const companyId = crypto.randomUUID();
      const { error: companyError } = await supabase
        .from('companies')
        .insert({ id: companyId, name: formData.companyName });

      if (companyError) {
        console.error('[REGISTER] Erro ao criar empresa:', JSON.stringify(companyError));
        setError('Erro ao criar empresa. Verifique as permissões no Supabase (RLS da tabela companies).');
        setLoading(false);
        return;
      }


      // ─── Etapa 4: Criar/atualizar perfil ───────────────────────────────────
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          company_id: companyId,
          full_name: formData.fullName,
          email: formData.email,
          role: 'admin',
          approved: false
          // Não incluir 'preferences' — a coluna pode não existir e causa erro silencioso
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('[REGISTER] Erro ao criar perfil:', JSON.stringify(profileError));
        if (!profileError.message?.includes('duplicate key')) {
          setError('Erro ao criar perfil: ' + profileError.message);
          setLoading(false);
          return;
        }
      }

      // ─── Etapa 5: Setup SaaS (Trial & Auto-Approve) ──────────────────────
      const setupRes = await fetch('/api/auth/setup-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          fullName: formData.fullName,
          email: formData.email
        })
      });

      if (!setupRes.ok) {
        console.warn('[REGISTER] Falha parcial no setup do tenant (Asaas).', await setupRes.text());
        // Mesmo falhando, podemos prosseguir e o painel avisará
      }

      // CRÍTICO: NÃO fazemos signOut(). O usuário será redirecionado para o dashboard.
      // E ele já estará aprovado, com subscription criada.

      console.log('[REGISTER] ✅ Cadastro completo! Redirecionando ao dashboard...');
      
      // Forçar atualização da sessão no router do Next
      router.refresh();
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

      // Não definimos setSuccess(true) porque não vamos mostrar a tela antiga de "Pendente"
      return;

    } catch (err: any) {
      console.error('[REGISTER] Exceção:', err.message);
      setError('Erro inesperado: ' + (err.message || 'Desconhecido'));
      setLoading(false);
    }

  };

  if (success) {
    return (
      <AnimatedBackground>
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative max-w-md w-full p-10 text-center">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />
             
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner mb-6 relative z-10">
               <CheckCircle2 className="h-10 w-10 animate-bounce" />
             </div>
             
             <h1 className="text-2xl font-bold font-serif mb-4 text-[#2C2825]">Solicitação enviada</h1>
             <p className="text-[#5C5855] leading-relaxed mb-8 text-sm">
               Sua conta foi criada e está <strong>pendente de aprovação</strong> pelo administrador.
               <br/><br/>
               Você receberá um e-mail com instruções assim que seu acesso for liberado.
             </p>
             
             <Button 
               onClick={() => router.push('/auth/login')}
               className="w-full h-12 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all relative z-10"
             >
               Voltar ao Login
             </Button>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
       {/* Glassmorphism Card */}
       <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative w-full max-w-xl mx-4">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

          <div className="px-8 sm:px-12 py-10 relative z-10">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-6">
                 <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#F0EBE0]/50">
                    <LogoImage size={56} />
                 </div>
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Crie sua conta</h1>
              <p className="text-[#5C5855] text-sm leading-relaxed">
                Faça seu primeiro acesso para gerenciar sua clínica.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50/90 border border-red-100 p-3 text-xs text-red-600 animate-shake shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              <div className="space-y-3">
                 {/* Nome e Empresa */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Nome da Clínica</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="Ex: Clínica Saúde"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                          required
                          value={formData.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Seu Nome</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="Ex: Dr. Silva"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                          required
                          value={formData.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                 </div>

                 {/* Email */}
                 <div className="space-y-1 group">
                   <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">E-mail Corporativo</label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                     <Input
                       type="email"
                       placeholder="seu@email.com"
                       className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                       required
                       value={formData.email}
                       onChange={(e) => handleChange('email', e.target.value)}
                       disabled={loading}
                     />
                   </div>
                 </div>

                 {/* Senhas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                          required
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Confirmar</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                 </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-4 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold text-base rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                   <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando conta...
                   </span>
                ) : (
                   <span className="flex items-center gap-2">
                      Criar minha conta profissional
                   </span>
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-[#E5E0D8]/50 flex flex-col items-center gap-4">
               <p className="text-[#8A847C] text-xs">
                 Já possui acesso?{' '}
                 <Link 
                   href="/auth/login" 
                   className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline"
                 >
                   Acessar minha conta
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
