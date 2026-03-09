'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn
} from '@projeto/ui';
import { 
  MessageSquare, 
  Plus, 
  Calendar, 
  Clock, 
  Gift, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  Star
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import { ReviewsWidget } from '@/components/marketing/ReviewsWidget';

type Rule = {
  id: string;
  name: string;
  trigger_type: 'birthday' | 'pre_appointment' | 'post_appointment';
  time_offset_minutes: number;
  message_template: string;
  benefit_text?: string | null;
  is_active: boolean;
  company_id: string;
};

type AutomationLog = {
  id: string;
  recipient_phone: string;
  status: string;
  sent_at: string;
  rule_id: string;
  error_message?: string;
  automation_rules?: { name: string };
};

function ReviewSettingsForm() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    google_review_url: '',
    enable_google_review: false,
    feedback_type: 'internal',
    external_forms_url: '',
    min_rating_for_google: 4
  });

  const supabase = createBrowserClient();

  useEffect(() => {
    if (profile?.company_id) {
       fetchSettings();
    }
  }, [profile?.company_id]);

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('review_settings')
      .select('*')
      .eq('company_id', profile?.company_id)
      .single();

    if (data) setSettings(data);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('review_settings')
      .upsert({
        company_id: profile?.company_id,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) alert('Erro ao salvar configurações');
    else alert('Configurações salvas!');
    setSaving(false);
  }

  if (loading) return <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-2xl">
       <div className="space-y-4">
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
                <Label className="text-base font-bold">Redirecionar para Google Review</Label>
                <p className="text-sm text-muted-foreground">Clientes que derem nota alta serão convidados a avaliar no Google.</p>
             </div>
             <Switch 
                checked={settings.enable_google_review} 
                onCheckedChange={(val) => setSettings({...settings, enable_google_review: val})} 
             />
          </div>

          {settings.enable_google_review && (
             <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>Link do seu Perfil no Google</Label>
                <Input 
                   placeholder="https://g.page/r/YOUR_ID/review" 
                   value={settings.google_review_url || ''} 
                   onChange={(e) => setSettings({...settings, google_review_url: e.target.value})}
                />
             </div>
          )}
       </div>

       <div className="space-y-4 pt-4 border-t">
          <div className="space-y-0.5">
             <Label className="text-base font-bold">Fluxo de Críticas (1-3 Estrelas)</Label>
             <p className="text-sm text-muted-foreground">Como deseja receber o feedback de clientes insatisfeitos?</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => setSettings({...settings, feedback_type: 'internal'})}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  settings.feedback_type === 'internal' ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-200"
                )}
             >
                <p className="font-bold text-sm">Feedback Interno</p>
                <p className="text-[10px] text-muted-foreground">Registra apenas dentro do aplicativo.</p>
             </button>
             <button 
                onClick={() => setSettings({...settings, feedback_type: 'external_forms'})}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  settings.feedback_type === 'external_forms' ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-200"
                )}
             >
                <p className="font-bold text-sm">Google Forms</p>
                <p className="text-[10px] text-muted-foreground">Redireciona para um formulário externo.</p>
             </button>
          </div>

          {settings.feedback_type === 'external_forms' && (
             <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>Link do Google Forms</Label>
                <Input 
                   placeholder="https://docs.google.com/forms/..." 
                   value={settings.external_forms_url || ''} 
                   onChange={(e) => setSettings({...settings, external_forms_url: e.target.value})}
                />
             </div>
          )}
       </div>

       <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto min-w-[200px] h-12 bg-primary text-white font-bold">
          {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Salvar Configurações'}
       </Button>
    </div>
  );
}

export default function AutomationClient() {
  const { profile } = useProfile();
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    name: '',
    trigger_type: 'pre_appointment',
    time_offset_minutes: -1440,
    message_template: '',
    is_active: true
  });

  const supabase = createBrowserClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchRules();
      fetchLogs();
    }
  }, [profile?.company_id]);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*, automation_rules(name)')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

  const handleToggleRule = async (id: string, currentState: boolean) => {
    // Optimistic Update
    setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentState } : r));

    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error updating rule:', error);
      // Revert if failed
      setRules(rules.map(r => r.id === id ? { ...r, is_active: currentState } : r));
      alert('Erro ao atualizar regra');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    setRules(rules.filter(r => r.id !== id));

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      fetchRules(); // Revert
      alert('Erro ao excluir regra');
    }
  };

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.message_template || !profile?.company_id) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          company_id: profile.company_id,
          name: newRule.name,
          trigger_type: newRule.trigger_type,
          time_offset_minutes: newRule.time_offset_minutes,
          message_template: newRule.message_template,
          benefit_text: newRule.benefit_text,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setRules([data, ...rules]);
      setIsCreating(false);
      setNewRule({
        name: '',
        trigger_type: 'pre_appointment',
        time_offset_minutes: -1440,
        message_template: '',
        benefit_text: '',
        is_active: true
      });
      alert('Regra criada com sucesso!');
    } catch (err: any) {
      console.error('Error saving rule:', err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
     return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif text-foreground">Marketing e Automação</h2>
          <p className="text-muted-foreground">Gerencie suas mensagens automáticas de WhatsApp e avaliações.</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)} 
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Regra
        </Button>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-[800px] h-auto p-1 bg-muted/30 rounded-2xl border border-[#E5E0D8]">
          <TabsTrigger value="rules" className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Regras</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="birthday_campaign" className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Aniversariantes</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Avaliações (NPS)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6 mt-6">
          {isCreating && (
            <Card className="bg-card border-l-4 border-l-primary animate-in slide-in-from-top-4">
              <CardHeader>
                <CardTitle>Nova Automação</CardTitle>
                <CardDescription>Configure quando e o que enviar para seus clientes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Regra</Label>
                    <Input 
                      placeholder="Ex: Lembrete Matinal" 
                      value={newRule.name} 
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gatilho (Quando enviar?)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newRule.trigger_type}
                      onChange={(e) => setNewRule({...newRule, trigger_type: e.target.value as any})}
                    >
                      <option value="pre_appointment">Antes do Agendamento (Lembrete)</option>
                      <option value="post_appointment">Depois do Agendamento (Pesquisa)</option>
                      <option value="birthday">Aniversário do Cliente</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tempo de Disparo</Label>
                  <div className="flex gap-4 items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Horas</span>
                      <Input 
                        type="number" 
                        value={Math.trunc((newRule.time_offset_minutes || 0) / 60)} 
                        onChange={(e) => {
                          const h = parseInt(e.target.value) || 0;
                          const currentM = Math.abs((newRule.time_offset_minutes || 0) % 60);
                          const isNegative = h < 0 || (h === 0 && e.target.value.startsWith('-'));
                          setNewRule({...newRule, time_offset_minutes: h * 60 + (isNegative ? -currentM : currentM)});
                        }}
                        className="w-24 h-12 text-center font-bold"
                      />
                    </div>
                    <div className="text-2xl font-serif text-muted-foreground pb-2">:</div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Minutos</span>
                      <Input 
                        type="number" 
                        min="0"
                        max="59"
                        value={Math.abs((newRule.time_offset_minutes || 0) % 60)} 
                        onChange={(e) => {
                          const m = Math.min(59, Math.abs(parseInt(e.target.value) || 0));
                          const currentH = Math.trunc((newRule.time_offset_minutes ?? 0) / 60);
                          const isNegative = currentH < 0 || (Object.is(currentH, -0) || ((newRule.time_offset_minutes ?? 0) < 0));
                          setNewRule({...newRule, time_offset_minutes: currentH * 60 + (isNegative ? -m : m)});
                        }}
                        className="w-24 h-12 text-center font-bold"
                      />
                    </div>
                    <div className="pb-1">
                      <p className="text-xs text-muted-foreground italic">
                        {newRule.trigger_type === 'pre_appointment' && 'Antes da consulta (use horas negativas)'}
                        {newRule.trigger_type === 'post_appointment' && 'Depois da consulta (use horas positivas)'}
                        {newRule.trigger_type === 'birthday' && 'Horário do dia (Ex: 09:00)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem (WhatsApp)</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Olá {cliente}, ..."
                    value={newRule.message_template}
                    onChange={(e) => setNewRule({...newRule, message_template: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Variáveis disponíveis: {'{cliente}, {profissional}, {data}, {hora}, {servico}'}</p>
                </div>

                {newRule.trigger_type === 'birthday' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-primary font-bold">Benefício de Aniversário (Opcional)</Label>
                    <Input 
                      placeholder="Ex: 20% de desconto em qualquer procedimento" 
                      value={newRule.benefit_text || ''} 
                      onChange={(e) => setNewRule({...newRule, benefit_text: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">Este benefício será destacado para a equipe quando o cliente agendar no mês.</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} disabled={saving}>Cancelar</Button>
                  <Button onClick={handleSaveRule} className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Regra'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {rules.length === 0 && !loading && (
               <div className="text-center py-12 text-muted-foreground">Nenhuma regra de automação criada.</div>
            )}
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                      {rule.trigger_type === 'birthday' ? <Gift className="w-6 h-6" /> : 
                       rule.trigger_type === 'pre_appointment' ? <Clock className="w-6 h-6" /> : 
                       <MessageSquare className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{rule.message_template}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground uppercase tracking-wide">
                          {rule.trigger_type === 'birthday' ? 'Aniversário' : 
                           rule.trigger_type === 'pre_appointment' ? 'Pré-Agendamento' : 'Pós-Agendamento'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.abs(rule.time_offset_minutes)} min {rule.time_offset_minutes < 0 ? 'antes' : 'depois'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${rule.id}`} className="text-sm text-muted-foreground">
                        {rule.is_active ? 'Ativo' : 'Pausado'}
                        </Label>
                        <Switch 
                        id={`active-${rule.id}`} 
                        checked={rule.is_active} 
                        onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)} 
                        />
                    </div>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>Últimos envios automáticos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum envio registrado recentemente.</div>
                ) : logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {log.status === 'sent' ? <MessageCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Destino: {log.recipient_phone}</p>
                        <p className="text-xs text-muted-foreground">Regra: {log.automation_rules?.name || 'Regra excluída'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`flex items-center gap-1 text-xs font-bold ${log.status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
                        {log.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status === 'sent' ? 'Entregue' : 'Falha'}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(log.sent_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="birthday_campaign" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Campanha de Aniversariantes do Mês</CardTitle>
                  <CardDescription>Clientes que fazem aniversário em {new Date().toLocaleDateString('pt-BR', { month: 'long' })} e não possuem agendamento.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Esta lógica precisaria de uma busca por clientes aniversariantes via props ou nova consulta */}
             {/* Por enquanto, como o componente é Client-Side, vamos sugerir a consulta ou o uso de filtros */}
             <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <p className="text-muted-foreground font-medium">Filtre seus clientes para iniciar o disparo de mensagens personalizadas.</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => window.location.href='/dashboard/clients'}>
                  Ir para Lista de Clientes
                </Button>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-6">
          <ReviewsWidget />
          
          <Card className="border-[#E5E0D8]">
            <CardHeader>
               <CardTitle className="font-serif">Configuração da Avaliação Híbrida</CardTitle>
               <CardDescription>Personalize como seus clientes avaliam sua clínica após o atendimento.</CardDescription>
            </CardHeader>
            <CardContent>
               <ReviewSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
