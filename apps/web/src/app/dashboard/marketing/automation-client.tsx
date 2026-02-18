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
  TabsTrigger
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
  Trash2
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
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="history">Histórico de Envios</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações (NPS)</TabsTrigger>
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
                  <Label>Tempo (Minutos de antecedência/atraso)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      value={newRule.time_offset_minutes} 
                      onChange={(e) => setNewRule({...newRule, time_offset_minutes: parseInt(e.target.value)})}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {newRule.trigger_type === 'pre_appointment' && 'minutos ANTES da consulta (-1440 = 24h antes)'}
                      {newRule.trigger_type === 'post_appointment' && 'minutos DEPOIS da consulta (60 = 1h depois)'}
                      {newRule.trigger_type === 'birthday' && 'minutos a partir da meia-noite (540 = 09:00)'}
                    </span>
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

        <TabsContent value="reviews" className="mt-6">
          <ReviewsWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
