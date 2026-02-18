'use client';

import { useState, useEffect } from 'react';
import { 
  Button,
  Badge,
  Card,
  CardContent,
  cn
} from '@projeto/ui';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Calendar,
  X 
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'reminder';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createBrowserClient();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Inscrição em tempo real para novas notificações
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-teal-500" />;
      case 'reminder': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-neutral-500" />;
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-neutral-100 rounded-full h-10 w-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/5" 
            onClick={() => setIsOpen(false)} 
          />
          <Card className="absolute right-0 mt-2 w-80 z-50 shadow-2xl border-neutral-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-bold text-neutral-900">Notificações</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[11px] uppercase font-bold text-primary-600 hover:text-primary-700"
                    onClick={markAllAsRead}
                  >
                    Marcar todas lidas
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-neutral-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma notificação por aqui.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 transition-colors hover:bg-neutral-50 relative group",
                        !n.is_read && "bg-primary-50/30"
                      )}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 space-y-1">
                          <p className={cn("text-sm font-bold", n.is_read ? "text-neutral-700" : "text-neutral-900")}>
                            {n.title}
                          </p>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-neutral-400 uppercase font-bold pt-1">
                            {format(new Date(n.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {notifications.length > 0 && (
              <div className="p-3 border-t text-center bg-neutral-50/30">
                <Button variant="ghost" size="sm" className="w-full text-xs text-neutral-500">
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
