'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowRight, Building, User, Mail, Lock, Loader2, CreditCard, ShieldCheck, MapPin, Phone, FileText } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';

// Auxiliares de formatação de máscara
const formatCPF = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatCNPJ = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const formatCEP = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const formatCardNumber = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})\d+?$/, '$1');
};

const formatCardExpiry = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\/\d{2})\d+?$/, '$1');
};

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'profissional';
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Cadastro & Clínica
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    cnpj: '',
    cpf: '',
    phone: '',
    lgpdConsent: false,
    
    // Step 2: Faturamento
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardPostalCode: '',
    cardAddressNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialAllowed, setTrialAllowed] = useState(true);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Coleta dados anônimos para o fingerprint
  const getDeviceDetails = () => {
    if (typeof window === 'undefined') return { fingerprint: '', browser: 'Unknown', os: 'Unknown' };
    
    const ua = navigator.userAgent;
    let browser = 'Outro';
    let os = 'Outro';
    
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      new Date().getTimezoneOffset()
    ].join('|');

    return { fingerprint, browser, os };
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    if (!formData.lgpdConsent) {
      setError('Você deve autorizar a utilização dos dados para prevenção de fraudes e cobrança.');
      setLoading(false);
      return;
    }

    try {
      // Executar pré-validação antifraude no servidor
      const { fingerprint } = getDeviceDetails();
      const res = await fetch('/api/auth/validate-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
          deviceFingerprint: fingerprint
        })
      });

      const check = await res.json();
      if (!res.ok) {
        throw new Error(check.error || 'Erro ao validar dados.');
      }

      // Verificar no Supabase Auth se o e-mail já possui conta cadastrada
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        const errStr = signUpError.message?.toLowerCase() || '';
        if (errStr.includes('already registered') || errStr.includes('already been registered') || errStr.includes('database error') || errStr.includes('saving new user')) {
          // Tenta fazer login para validar se a senha informada é a correta
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (signInError || !signInData?.user) {
            throw new Error('Este e-mail já possui uma conta cadastrada no Supabase. Faça login com sua senha ou utilize um novo e-mail (ex: teste.novo@gmail.com).');
          }
        } else {
          throw new Error('Erro no cadastro: ' + signUpError.message);
        }
      }

      setTrialAllowed(check.trialAllowed);
      
      // Prossegue para a etapa do cartão
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao validar seus dados de cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createBrowserClient();
      let userId: string;

      // ─── Etapa 1: Criar usuário no Auth ────────────────────────────────────
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        const errStr = signUpError.message?.toLowerCase() || '';
        if (errStr.includes('already registered') || errStr.includes('already been registered') || errStr.includes('database error') || errStr.includes('saving new user')) {
          console.log('[REGISTER] Usuário existente ou estado pendente no Supabase Auth, tentando autenticar...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (signInError || !signInData?.user) {
            setError('Este e-mail já possui uma conta cadastrada no Supabase. Faça login com sua senha ou utilize um novo e-mail (ex: teste.novo@gmail.com).');
            setLoading(false);
            return;
          }
          userId = signInData.user.id;
        } else {
          setError('Erro no cadastro: ' + signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        if (!authData.user) {
          setError('Erro ao criar usuário de autenticação. Tente novamente.');
          setLoading(false);
          return;
        }
        userId = authData.user.id;
      }

      // ─── Etapa 2: Configurar o Tenant, Asaas e Antifraude ─────────────────
      const { fingerprint, browser, os } = getDeviceDetails();

      const setupRes = await fetch('/api/auth/setup-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          fullName: formData.fullName,
          email: formData.email,
          plan: selectedPlan,
          cnpj: formData.cnpj || null,
          cpf: formData.cpf,
          phone: formData.phone,
          deviceFingerprint: fingerprint,
          deviceBrowser: browser,
          deviceOs: os,
          cardHolderName: formData.cardHolderName,
          cardNumber: formData.cardNumber,
          cardExpiry: formData.cardExpiry,
          cardCvv: formData.cardCvv,
          cardPostalCode: formData.cardPostalCode,
          cardAddressNumber: formData.cardAddressNumber
        })
      });

      const setupData = await setupRes.json();
      if (!setupRes.ok) {
        setError(setupData.error || 'Falha ao registrar cartão no gateway de pagamentos. Verifique os dados do cartão.');
        setLoading(false);
        return;
      }

      console.log('[REGISTER] ✅ Cadastro completo com cartão de crédito!');
      
      // Se não tiver trial e houver fatura pendente, ou fallback
      if (setupData.invoiceUrl && !setupData.trialAllowed) {
        window.location.href = setupData.invoiceUrl;
        return;
      }

      router.refresh();
      router.push('/dashboard');

    } catch (err: any) {
      console.error('[REGISTER] Exceção:', err.message);
      setError('Erro inesperado: ' + (err.message || 'Desconhecido'));
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
       <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative w-full max-w-xl mx-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

          <div className="px-8 sm:px-12 py-10 relative z-10">
            <div className="mb-6 text-center">
              <div className="flex justify-center mb-4">
                 <LogoImage size={80} />
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">
                {step === 1 ? 'Crie sua conta' : 'Método de Pagamento'}
              </h1>
              <p className="text-[#5C5855] text-xs leading-relaxed max-w-xs mx-auto">
                {step === 1 
                  ? 'Preencha os dados profissionais para iniciar seu teste gratuito.' 
                  : 'Insira as informações do cartão para ativar sua assinatura.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50/90 border border-red-100 p-3 text-xs text-red-600 animate-shake shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* ─── PASSO 1: DADOS CADASTRAIS ─────────────────────────────────── */}
            {step === 1 && (
              <form className="space-y-4" onSubmit={handleNextStep}>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Nome da Clínica</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="Ex: Clínica Odonto"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">CNPJ (Opcional)</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="00.000.000/0000-00"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          value={formData.cnpj}
                          onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="Seu nome"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">CPF</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.cpf}
                          onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          placeholder="(00) 00000-0000"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">Confirmar Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-11 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aceite LGPD */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                     <div className="flex items-center h-5">
                        <input 
                          type="checkbox" 
                          required 
                          checked={formData.lgpdConsent}
                          onChange={(e) => handleChange('lgpdConsent', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]" 
                        />
                     </div>
                     <div className="text-xs text-[#5C5855] leading-relaxed">
                       Autorizo a utilização dos meus dados para criação da conta, prevenção de fraude e cobrança da assinatura. Concedo este aceite sob os termos da <Link href="/politica-de-privacidade" target="_blank" className="font-bold text-[#D4AF37] hover:underline">Política de Privacidade</Link>.
                     </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-4 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validando cadastro...
                    </>
                  ) : (
                    <>
                      Avançar para Pagamento
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ─── PASSO 2: MÉTODO DE PAGAMENTO ──────────────────────────────── */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleRegister}>
                
                {/* Alerta de Trial Liberado ou Bloqueado */}
                {trialAllowed ? (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 shadow-sm leading-relaxed">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Teste Grátis por 7 dias Ativado!</strong>
                      Nenhum valor será debitado hoje. Seu cartão será verificado pelo nosso gateway de pagamento e a cobrança automática iniciará após o período de teste de 7 dias caso decida continuar.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-xs text-red-950 shadow-sm leading-relaxed">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Teste Gratuito Indisponível</strong>
                      Identificamos que estes dados (CPF/Dispositivo/IP) já utilizaram o período de testes grátis anteriormente. Você pode prosseguir normalmente contratando a assinatura paga hoje.
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Cartão de Crédito */}
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">Nome no Cartão</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D]" />
                      <Input
                        placeholder="NOME DO TITULAR"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 pl-10 text-sm text-[#2C2825] uppercase"
                        required
                        value={formData.cardHolderName}
                        onChange={(e) => handleChange('cardHolderName', e.target.value.toUpperCase())}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">Número do Cartão</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D]" />
                      <Input
                        placeholder="0000 0000 0000 0000"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 pl-10 text-sm text-[#2C2825]"
                        required
                        value={formData.cardNumber}
                        onChange={(e) => handleChange('cardNumber', formatCardNumber(e.target.value))}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">Validade</label>
                      <Input
                        placeholder="MM/AA"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 text-sm text-[#2C2825] text-center"
                        required
                        value={formData.cardExpiry}
                        onChange={(e) => handleChange('cardExpiry', formatCardExpiry(e.target.value))}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">CVV</label>
                      <Input
                        placeholder="123"
                        maxLength={4}
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 text-sm text-[#2C2825] text-center"
                        required
                        value={formData.cardCvv}
                        onChange={(e) => handleChange('cardCvv', e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">CEP de Cobrança</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D]" />
                        <Input
                          placeholder="00000-000"
                          className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 pl-10 text-sm text-[#2C2825]"
                          required
                          value={formData.cardPostalCode}
                          onChange={(e) => handleChange('cardPostalCode', formatCEP(e.target.value))}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1">Nº do Endereço</label>
                      <Input
                        placeholder="Ex: 123"
                        className="bg-white/60 border-white/50 focus:border-[#D4AF37] h-11 text-sm text-[#2C2825] text-center"
                        required
                        value={formData.cardAddressNumber}
                        onChange={(e) => handleChange('cardAddressNumber', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 h-12 border border-[#E5E0D8] text-[#5C5855] font-bold text-xs rounded-xl hover:bg-gray-50 transition-all"
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="w-2/3 h-12 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finalizando cadastro...
                      </>
                    ) : (
                      <>
                        Finalizar e Acessar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
            
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
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[10px] font-bold text-[#A8A49D] uppercase tracking-widest mt-4">
                 <Link href="/politica-de-privacidade" className="hover:text-[#D4AF37] transition-colors">Privacidade</Link>
                 <span className="hidden sm:inline">•</span>
                 <Link href="/termos-de-uso" className="hover:text-[#D4AF37] transition-colors">Termos de Uso</Link>
                 <span className="hidden sm:inline">•</span>
                 <Link href="/suporte" className="hover:text-[#D4AF37] transition-colors">Suporte</Link>
               </div>
               
               <p className="text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70 mt-4">
                 © {new Date().getFullYear()} Agenda Inteligente
               </p>
            </div>
          </div>
       </div>
    </AnimatedBackground>
  );
}

export default function RegisterPage() {
   return (
     <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>}>
       <RegisterFormContent />
     </Suspense>
   );
}
