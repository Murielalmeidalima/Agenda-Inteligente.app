'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@projeto/ui';
import { TrendingUp, Users, AlertCircle, Clock, CheckCircle2, ShieldAlert, ShieldCheck, Percent, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AntifraudRecord {
  id: string;
  email: string;
  cpf: string;
  phone: string;
  cnpj: string | null;
  ip_address: string;
  device_fingerprint: string | null;
  device_browser: string | null;
  device_os: string | null;
  score: number;
  is_blocked: boolean;
  created_at: string;
}

export default function SaaSAdminDashboard() {
  const [stats, setStats] = useState({
    mrr: 0,
    activeUsers: 0,
    trialUsers: 0,
    pastDue: 0,
    expiredTrials: 0,
    convertedTrials: 0,
    conversionRate: 0,
    fraudAttempts: 0,
  });
  const [recentBlocked, setRecentBlocked] = useState<AntifraudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSaaSMetrics = async () => {
      try {
        setError('');
        const res = await fetch('/api/admin/metrics');
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Acesso negado. Esta página é restrita a Super Administradores.');
          }
          throw new Error('Falha ao carregar métricas.');
        }

        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentBlocked(data.recentBlocked || []);
        }
      } catch (err: any) {
        console.error('Erro ao buscar metricas:', err);
        setError(err.message || 'Ocorreu um erro ao buscar dados do servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchSaaSMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
        <p className="text-[10px] text-[#2C2825]/60 font-bold uppercase tracking-widest animate-pulse">
          Carregando Painel Administrativo...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Erro de Acesso</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-serif text-[#2C2825] mb-2">Painel Administrativo SaaS</h1>
        <p className="text-[#5C5855] text-sm">Métricas consolidadas de faturamento, trials e prevenção a fraudes em tempo real.</p>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Recorrente (MRR)</h3>
            <TrendingUp className="text-emerald-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.mrr.toFixed(2).replace('.', ',')}
          </p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assinaturas Ativas</h3>
            <CheckCircle2 className="text-[#D4AF37] w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trials Ativos</h3>
            <Clock className="text-blue-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.trialUsers}</p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inadimplentes (Past Due)</h3>
            <AlertCircle className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pastDue}</p>
        </Card>
      </div>

      {/* Grid de Métricas de Trial e Fraude */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa de Conversão</h4>
            <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400">{stats.convertedTrials} convertidos de {stats.convertedTrials + stats.trialUsers + stats.expiredTrials} total</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tentativas de Fraude</h4>
            <p className="text-2xl font-bold text-gray-900">{stats.fraudAttempts}</p>
            <p className="text-[10px] text-gray-400">Contas sinalizadas com risco e bloqueadas de trial</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trials Expirados</h4>
            <p className="text-2xl font-bold text-gray-900">{stats.expiredTrials}</p>
            <p className="text-[10px] text-gray-400">Assinaturas trial que atingiram 7 dias sem conversão</p>
          </div>
        </Card>
      </div>

      {/* Seção de Logs Antifraude */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-[#2C2825] font-serif">Logs de Verificação Antifraude</h3>
            <p className="text-xs text-[#5C5855]">Histórico recente de cadastros de teste gratuito e análises de score.</p>
          </div>
          <Badge className="bg-[#D4AF37]/10 text-[#B5952F] border-none px-3 py-1 font-bold rounded-full text-xs">
            Monitorando
          </Badge>
        </div>

        <div className="overflow-x-auto">
          {recentBlocked.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-gray-200" />
              <p className="text-sm font-medium">Nenhum cadastro verificado até o momento.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/20">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Responsável / E-mail</th>
                  <th className="px-6 py-4">CPF / CNPJ</th>
                  <th className="px-6 py-4">IP / Dispositivo</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {recentBlocked.map((record) => (
                  <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors text-xs text-gray-600">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{record.email}</div>
                      <div className="text-[10px] text-gray-400">{record.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>CPF: {record.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</div>
                      {record.cnpj && (
                        <div className="text-[10px] text-gray-400">
                          CNPJ: {record.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{record.ip_address}</div>
                      <div className="text-[10px] text-gray-400">
                        {record.device_browser || 'Navegador N/A'} • {record.device_os || 'OS N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${
                        record.score >= 100 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : record.score >= 50 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {record.score} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.is_blocked ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Liberado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
