'use client';

import { useState, useEffect } from 'react';
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
  Contact2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  async function fetchClient() {
    try {
      const supabase = createBrowserClient();
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;
      if (client) {
        setFormData({
          full_name: client.full_name || '',
          phone: client.phone || '',
          email: client.email || '',
          cpf: client.cpf || '',
          gender: client.gender || '',
          birth_date: client.birth_date || '',
          instagram: client.instagram || '',
          address_street: client.address_street || '',
          address_number: client.address_number || '',
          address_neighborhood: client.address_neighborhood || '',
          address_city: client.address_city || '',
          address_state: client.address_state || '',
          address_zip_code: client.address_zip_code || '',
          emergency_contact_name: client.emergency_contact_name || '',
          emergency_contact_phone: client.emergency_contact_phone || '',
          observations: client.observations || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching client:', err);
      setError('Erro ao carregar dados do cliente.');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const supabase = createBrowserClient();
      
      // Preparar dados (tratar strings vazias como null para evitar erros de UNIQUE ou obrigatoriedade)
      const sanitizedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );

      const { error: updateError } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', params.id);

      if (updateError) throw updateError;

      router.push(`/dashboard/clients/${params.id}`);
      router.refresh();
      router.push('/dashboard/clients'); // Redirect to list after edit
    } catch (err: any) {
      console.error('Error updating client:', err);
      setError(err.message || 'Erro ao salvar alterações. Tente novamente.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Carregando Perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href={`/dashboard/clients/${params.id}`}>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-[#0f172a]/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Button>
           </Link>
           <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Editar Cadastro</h1>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">Atualizar informações do paciente</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all"
          disabled={saving}
          loading={saving}
        >
          <Save className="h-5 w-5 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>
         
         {/* Main Info */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                     <User className="h-4 w-4 text-primary-500" />
                     Dados Pessoais
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nome Completo</label>
                        <div className="relative group">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-primary-500 transition-colors" />
                           <Input 
                              placeholder="Digite o nome..." 
                              className="bg-[#020617] border-neutral-800 h-11 pl-10 rounded-xl text-white placeholder:text-neutral-700"
                              required
                              value={formData.full_name}
                              onChange={(e) => handleChange('full_name', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">CPF</label>
                        <div className="relative group">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-primary-500 transition-colors" />
                           <Input 
                              placeholder="000.000.000-00" 
                              className="bg-[#020617] border-neutral-800 h-11 pl-10 rounded-xl text-white placeholder:text-neutral-700"
                              value={formData.cpf}
                              onChange={(e) => handleChange('cpf', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">E-mail</label>
                        <div className="relative group">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-primary-500 transition-colors" />
                           <Input 
                              type="email"
                              placeholder="exemplo@email.com" 
                              className="bg-[#020617] border-neutral-800 h-11 pl-10 rounded-xl text-white placeholder:text-neutral-700"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefone / WhatsApp</label>
                        <div className="relative group">
                           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-primary-500 transition-colors" />
                           <Input 
                              placeholder="(00) 00000-0000" 
                              className="bg-[#020617] border-neutral-800 h-11 pl-10 rounded-xl text-white placeholder:text-neutral-700"
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
                           <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-purple-500 transition-colors" />
                           <Input 
                              placeholder="@usuario" 
                              className="bg-[#020617] border-neutral-800 h-11 pl-10 rounded-xl text-white placeholder:text-neutral-700"
                              value={formData.instagram}
                              onChange={(e) => handleChange('instagram', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Data de Nascimento</label>
                        <Input 
                           type="date"
                           className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white appearance-none"
                           value={formData.birth_date}
                           onChange={(e) => handleChange('birth_date', e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-primary-500" />
                     Endereço
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                     <div className="md:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Rua / Logradouro</label>
                        <Input 
                           placeholder="Ex: Av. Brasil" 
                           className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
                           value={formData.address_street}
                           onChange={(e) => handleChange('address_street', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nº</label>
                        <Input 
                           placeholder="123" 
                           className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
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
                           className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
                           value={formData.address_neighborhood}
                           onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Cidade</label>
                        <Input 
                           placeholder="Ex: São Paulo" 
                           className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
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
            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                     <AlertCircle className="h-4 w-4 text-amber-500" />
                     Contato Emergência
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Nome do Contato</label>
                     <Input 
                        placeholder="Nome..." 
                        className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefone</label>
                     <Input 
                        placeholder="(00) 00000-0000" 
                        className="bg-[#020617] border-neutral-800 h-11 rounded-xl text-white placeholder:text-neutral-700"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                     />
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                     <Contact2 className="h-4 w-4 text-primary-500" />
                     Observações
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8">
                  <TextArea 
                     placeholder="Histórico médico, restrições ou notas importantes sobre o paciente..."
                     className="bg-[#020617] border-neutral-800 rounded-2xl text-white placeholder:text-neutral-700 h-40"
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
