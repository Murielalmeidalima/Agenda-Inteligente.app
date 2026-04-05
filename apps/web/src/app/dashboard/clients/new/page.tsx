'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  TextArea,
  cn
} from '@projeto/ui';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  AlertCircle,
  Hash,
  Contact2
} from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    cpf: '',
    gender: '',
    birth_date: '',
    instagram: '',
    address_street: '',
    address_number: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    observations: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createBrowserClient();
      
      // 1. Pegar profile para company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // 2. Preparar dados (tratar strings vazias como null para evitar erros de UNIQUE ou obrigatoriedade)
      const sanitizedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );

      // 3. Inserir cliente
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          ...sanitizedData,
          company_id: profile.company_id,
        });

      if (insertError) throw insertError;

      router.push('/dashboard/clients');
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      console.error('Error creating client:', err);
      setError(err.message || 'Erro ao salvar cliente. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/dashboard/clients">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Button>
           </Link>
           <div>
              <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Novo Cadastro</h1>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">Configurar perfil completo do paciente</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all"
          disabled={loading}
          loading={loading}
        >
          <Save className="h-5 w-5 mr-2" />
          Salvar Paciente
        </Button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>
         
         {/* Main Info */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="bg-neutral-50 border-b border-neutral-200 py-4 px-8">
                  <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                     <User className="h-4 w-4 text-primary-600" />
                     Dados Pessoais
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nome Completo</label>
                        <div className="relative group">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                           <Input 
                              placeholder="Digite o nome..." 
                              className="bg-white border-neutral-200 h-11 pl-10 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              required
                              value={formData.full_name}
                              onChange={(e) => handleChange('full_name', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">CPF</label>
                        <div className="relative group">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                           <Input 
                              placeholder="000.000.000-00" 
                              className="bg-white border-neutral-200 h-11 pl-10 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              value={formData.cpf}
                              onChange={(e) => handleChange('cpf', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">E-mail</label>
                        <div className="relative group">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                           <Input 
                              type="email"
                              placeholder="exemplo@email.com" 
                              className="bg-white border-neutral-200 h-11 pl-10 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefone / WhatsApp</label>
                        <div className="relative group">
                           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                           <Input 
                              placeholder="(00) 00000-0000" 
                              className="bg-white border-neutral-200 h-11 pl-10 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              required
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Instagram</label>
                        <div className="relative group">
                           <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-purple-500 transition-colors" />
                           <Input 
                              placeholder="@usuario" 
                              className="bg-white border-neutral-200 h-11 pl-10 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              value={formData.instagram}
                              onChange={(e) => handleChange('instagram', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Data de Nascimento</label>
                        <Input 
                           type="date"
                           className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 appearance-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                           value={formData.birth_date}
                           onChange={(e) => handleChange('birth_date', e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="bg-neutral-50 border-b border-neutral-200 py-4 px-8">
                  <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-primary-600" />
                     Endereço
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                     <div className="md:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Rua / Logradouro</label>
                        <Input 
                           placeholder="Ex: Av. Brasil" 
                           className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                           value={formData.address_street}
                           onChange={(e) => handleChange('address_street', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nº</label>
                        <Input 
                           placeholder="123" 
                           className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                           value={formData.address_number}
                           onChange={(e) => handleChange('address_number', e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Bairro</label>
                        <Input 
                           placeholder="Digite o bairro..." 
                           className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                           value={formData.address_neighborhood}
                           onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Cidade</label>
                        <Input 
                           placeholder="Ex: São Paulo" 
                           className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                           value={formData.address_city}
                           onChange={(e) => handleChange('address_city', e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Side Info */}
         <div className="space-y-8">
            <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="bg-neutral-50 border-b border-neutral-200 py-4 px-8">
                  <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                     <AlertCircle className="h-4 w-4 text-amber-500" />
                     Contato Emergência
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nome do Contato</label>
                     <Input 
                        placeholder="Nome..." 
                        className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefone</label>
                     <Input 
                        placeholder="(00) 00000-0000" 
                        className="bg-white border-neutral-200 h-11 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                     />
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="bg-neutral-50 border-b border-neutral-200 py-4 px-8">
                  <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                     <Contact2 className="h-4 w-4 text-primary-600" />
                     Observações
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8">
                  <TextArea 
                     placeholder="Histórico médico, restrições ou notas importantes sobre o paciente..."
                     className="bg-white border-neutral-200 rounded-2xl text-neutral-900 placeholder:text-neutral-400 h-40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-3"
                     value={formData.observations}
                     onChange={(e) => handleChange('observations', e.target.value)}
                  />
               </CardContent>
            </Card>

            {error && (
               <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
               </div>
            )}
         </div>

      </form>
    </div>
  );
}
