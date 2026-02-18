'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input, Badge } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowRight, Building, User, Mail, Lock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

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
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar usuário');
        setLoading(false);
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ name: formData.companyName })
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        setError('Erro ao criar empresa');
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          company_id: companyData.id,
          full_name: formData.fullName,
          email: formData.email,
          role: 'admin',
          approved: false // Explicitly set pending
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError('Erro ao criar perfil');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] text-[#2C2825] p-4 font-sans">
        <div className="text-center space-y-8 max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-[#E5E0D8]">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
            <CheckCircle2 className="h-12 w-12 animate-bounce" />
          </div>
          <div>
             <h1 className="text-3xl font-bold font-serif mb-4">Solicitação enviada</h1>
             <p className="text-[#8A847C] leading-relaxed">
               Sua conta foi criada e está <strong>pendente de aprovação</strong> pelo administrador.
               <br/><br/>
               Você receberá um e-mail com instruções assim que seu acesso for liberado.
             </p>
          </div>
          <Link href="/auth/login">
            <Button className="w-full h-12 bg-[#2C2825] text-white hover:bg-black rounded-xl">
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-neutral-800 font-sans selection:bg-[#D4AF37]/20">
       {/* Left side: Image */}
       <div className="hidden lg:flex flex-1 relative bg-[#F5F5DC] group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FDFBF7]/20 pointer-events-none z-10" />
        <img 
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=2070" 
          alt="Clinic Care" 
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply scale-105 group-hover:scale-100 transition-transform duration-1000"
        />
        
        <div className="relative z-20 flex flex-col justify-end p-16 w-full max-w-2xl h-full">
           <div className="space-y-6">
              <Badge className="bg-white/90 text-[#0EA5E9] border border-white/50 px-4 py-1.5 backdrop-blur-md shadow-xl text-xs font-bold uppercase tracking-widest w-fit">
                Junte-se a nós
              </Badge>
              <h2 className="text-5xl font-bold leading-tight text-white drop-shadow-md font-serif">Comece sua jornada profissional hoje.</h2>
              <p className="text-white/90 text-xl font-medium max-w-lg">Transforme a maneira como você gerencia sua clínica e cuida dos seus pacientes com a Agenda Inteligente.</p>
           </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 py-12 lg:w-[600px] bg-white relative overflow-hidden shadow-2xl z-20">
        <div className="mx-auto w-full max-w-md relative z-10">
          <div className="mb-8">
            <Link href="/auth/login" className="inline-flex items-center gap-2 group mb-8 text-[#8A847C] hover:text-[#2C2825] transition-colors font-medium">
               <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm">Voltar para Login</span>
            </Link>
            
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-white p-1.5 rounded-xl shadow-sm border border-[#F0EBE0]">
                  <Logo size={40} />
               </div>
               <span className="text-4xl font-bold tracking-tight text-[#2C2825] font-serif">Agenda Inteligente</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Crie sua conta.</h1>
            <p className="text-[#8A847C]">Preencha os campos abaixo para configurar sua clínica.</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 animate-shake shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1.5 group">
                 <label className="text-xs font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Nome da Clínica</label>
                 <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                    <Input
                      placeholder="Ex: Clínica Saúde"
                      className="bg-[#FAF9F6] border-[#E5E0D8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-12 text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:border-[#D4AF37]/50"
                      required
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      disabled={loading}
                    />
                 </div>
              </div>
              
              <div className="space-y-1.5 group">
                 <label className="text-xs font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Seu Nome</label>
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                    <Input
                      placeholder="Ex: Dr. Silva"
                      className="bg-[#FAF9F6] border-[#E5E0D8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-12 text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:border-[#D4AF37]/50"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      disabled={loading}
                    />
                 </div>
              </div>

              <div className="space-y-1.5 group">
                 <label className="text-xs font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">E-mail</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-[#FAF9F6] border-[#E5E0D8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-12 text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:border-[#D4AF37]/50"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={loading}
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                   <label className="text-xs font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Senha</label>
                   <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="bg-[#FAF9F6] border-[#E5E0D8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-12 text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:border-[#D4AF37]/50"
                        required
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        disabled={loading}
                      />
                   </div>
                </div>
                
                <div className="space-y-1.5 group">
                   <label className="text-xs font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Confirmar</label>
                   <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="bg-[#FAF9F6] border-[#E5E0D8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-12 text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:border-[#D4AF37]/50"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        disabled={loading}
                      />
                   </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8A847C] text-center px-4">
              Ao criar sua conta, você concorda com nossos <Link href="#" className="underline hover:text-[#D4AF37]">Termos</Link> e <Link href="#" className="underline hover:text-[#D4AF37]">Privacidade</Link>.
            </p>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white font-bold text-lg rounded-2xl shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              loading={loading}
              disabled={loading}
            >
              {loading ? (
                 <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                 </span>
              ) : (
                 <span className="flex items-center gap-2">
                    Criar minha conta profissional
                 </span>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm">
            <span className="text-[#8A847C]">Já possui acesso? </span>
            <Link 
              href="/auth/login" 
              className="font-bold text-[#D4AF37] hover:text-[#B5952F] transition-colors hover:underline hover:decoration-[#D4AF37]/30 underline-offset-4"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
