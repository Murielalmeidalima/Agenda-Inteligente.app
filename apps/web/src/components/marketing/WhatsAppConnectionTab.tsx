'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@projeto/ui';
import { RefreshCw, QrCode, Smartphone, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppConnectionTab() {
  const [status, setStatus] = useState<string>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const data = await res.json();
      
      if (data?.instance?.state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else if (data?.instance?.state === 'not_created') {
        setStatus('not_created');
      } else if (data?.instance?.state === 'connecting') {
        setStatus('connecting');
        fetchQrCode();
      } else {
        setStatus('disconnected');
        if (data?.instance?.state !== 'close') {
           fetchQrCode();
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const createInstance = async () => {
    setLoading(true);
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      await fetchQrCode();
    } catch (error) {
      toast.error('Erro ao criar instância do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      });
      const data = await res.json();
      if (data?.base64) {
        setQrCode(data.base64);
        setStatus('qr_ready');
        
        // Start polling for connection success
        const interval = setInterval(async () => {
           const pollRes = await fetch('/api/whatsapp', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ action: 'status' })
           });
           const pollData = await pollRes.json();
           if (pollData?.instance?.state === 'open') {
             clearInterval(interval);
             setStatus('connected');
             setQrCode(null);
             toast.success('WhatsApp Conectado com Sucesso!');
           }
        }, 5000);
      }
    } catch (error) {
      toast.error('Erro ao buscar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      setStatus('not_created');
      setQrCode(null);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      toast.error('Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100 flex-shrink-0">
            <Smartphone className="w-8 h-8 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-rose-950 mb-2">Conecte seu WhatsApp Oficial</h2>
            <p className="text-rose-800 text-sm md:text-base leading-relaxed max-w-3xl">
              Para que as automações e mensagens de marketing funcionem, você precisa vincular o WhatsApp da sua clínica ao sistema.
              Leia o QR Code abaixo usando o aplicativo oficial do WhatsApp (Business ou normal) para autorizar o disparo de mensagens automáticas.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-rose-800 font-medium list-disc list-inside">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque no menu (três pontinhos) ou em Configurações</li>
              <li>Selecione <strong>Aparelhos Conectados</strong> e toque em <strong>Conectar um Aparelho</strong></li>
              <li>Aponte a câmera para o QR Code que aparecerá abaixo</li>
            </ul>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto shadow-xl shadow-slate-200/50 border-slate-200 rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            Status da Conexão
          </CardTitle>
          <CardDescription className="text-base">
            Aqui você gerencia a conexão entre o sistema e o seu número de WhatsApp.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-12 min-h-[400px] bg-white">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center text-slate-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="font-medium animate-pulse">Verificando status da conexão...</p>
            </div>
          )}

          {(status === 'not_created' || status === 'disconnected') && !qrCode && (
            <div className="flex flex-col items-center text-center gap-4 max-w-sm">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-2 border-2 border-slate-100">
                <Smartphone className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">WhatsApp Desconectado</h3>
              <p className="text-slate-500 mb-4">
                Clique no botão abaixo para gerar o QR Code exclusivo da sua clínica e realizar a conexão.
              </p>
              <Button onClick={createInstance} disabled={loading} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 font-bold text-lg transition-all active:scale-95">
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <QrCode className="w-5 h-5 mr-2" />}
                Gerar QR Code de Conexão
              </Button>
            </div>
          )}

          {status === 'qr_ready' && qrCode && (
            <div className="flex flex-col items-center gap-8 w-full animate-in zoom-in-95 duration-500">
              <div className="bg-white p-6 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] border-2 border-slate-100">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-black text-2xl text-slate-900">Escaneie o QR Code</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera.
                </p>
              </div>
              <Button variant="outline" className="h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50" onClick={fetchQrCode} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar QR Code
              </Button>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center text-center gap-5 animate-in slide-in-from-bottom-4">
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center border-4 border-white shadow-xl relative z-10">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl font-black text-emerald-600 tracking-tight">Conectado com Sucesso!</h3>
              <p className="text-slate-600 max-w-sm text-lg">
                O seu número está vinculado. As mensagens de marketing e os lembretes já podem ser disparados.
              </p>
              
              <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left w-full max-w-sm flex items-start gap-4 text-amber-800 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-sm font-medium">Mantenha seu celular conectado à internet para garantir o envio das mensagens.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
             <div className="text-red-500 text-center animate-in shake">
               <div className="w-20 h-20 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4">
                 <AlertCircle className="w-10 h-10 text-red-500" />
               </div>
               <h3 className="text-2xl font-bold mb-2">Erro de Conexão</h3>
               <p className="text-slate-600">Não foi possível conectar com o servidor do WhatsApp.</p>
               <p className="text-sm text-slate-500 mt-1 mb-6">Verifique se a Evolution API está rodando.</p>
               <Button className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black font-bold" onClick={checkStatus}>
                 Tentar Novamente
               </Button>
             </div>
          )}
        </CardContent>
        
        {status === 'connected' && (
          <CardFooter className="bg-slate-50 border-t justify-end p-6">
            <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl" onClick={logout} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              Desconectar Dispositivo
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
