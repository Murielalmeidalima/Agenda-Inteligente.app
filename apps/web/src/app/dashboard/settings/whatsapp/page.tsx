'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@projeto/ui';
import { RefreshCw, QrCode, Smartphone, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppSettingsPage() {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conexão WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte o número de WhatsApp da sua clínica para enviar lembretes e confirmações automáticas.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" />
            Status da Conexão
          </CardTitle>
          <CardDescription>
            Escaneie o QR Code com o WhatsApp (em "Aparelhos Conectados") para vincular o seu número.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-10 min-h-[300px] border-y bg-neutral-50/50">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center text-neutral-500 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Verificando status da conexão...</p>
            </div>
          )}

          {(status === 'not_created' || status === 'disconnected') && !qrCode && (
            <div className="flex flex-col items-center text-center gap-4 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
                <Smartphone className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum WhatsApp Conectado</h3>
              <p className="text-sm text-neutral-500">
                Para enviar mensagens automáticas, você precisa conectar um número de WhatsApp escaneando um QR Code.
              </p>
              <Button onClick={createInstance} disabled={loading} className="mt-4 bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                Gerar QR Code de Conexão
              </Button>
            </div>
          )}

          {status === 'qr_ready' && qrCode && (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium text-lg">Escaneie o QR Code</h3>
                <p className="text-sm text-neutral-500 max-w-sm">
                  Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para esta tela.
                </p>
              </div>
              <Button variant="outline" onClick={fetchQrCode} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar QR Code
              </Button>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2 border-4 border-white shadow-sm">
                <Smartphone className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">Conectado com Sucesso!</h3>
              <p className="text-sm text-neutral-500 max-w-sm">
                O seu número está vinculado e pronto para enviar mensagens automáticas de agendamento.
              </p>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left w-full max-w-sm flex items-start gap-3 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Mantenha seu celular conectado à internet para garantir o envio das mensagens.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
             <div className="text-red-500 text-center">
               <AlertCircle className="w-10 h-10 mx-auto mb-2" />
               <p>Erro ao conectar com o servidor do WhatsApp.</p>
               <p className="text-sm opacity-80 mt-1">Verifique se a Evolution API está rodando.</p>
               <Button variant="outline" className="mt-4" onClick={checkStatus}>Tentar Novamente</Button>
             </div>
          )}
        </CardContent>
        
        {status === 'connected' && (
          <CardFooter className="bg-neutral-50 border-t justify-end p-4">
            <Button variant="destructive" onClick={logout} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              Desconectar WhatsApp
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
