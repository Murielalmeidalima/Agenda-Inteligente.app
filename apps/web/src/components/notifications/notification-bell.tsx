'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button, Card, Badge } from '@projeto/ui';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function NotificationBell() {
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
       fetchNotifications();
       // Optional: Realtime subscription here
    }
  }, [profile]);

  async function fetchNotifications() {
     const supabase = createBrowserClient();
     if (!profile?.company_id) return;

     const { data } = await supabase
       .from('notifications')
       .select('*')
       .eq('company_id', profile.company_id)
       .or(`profile_id.is.null,profile_id.eq.${profile.id}`)
       .order('created_at', { ascending: false })
       .limit(10);
     
     if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
     }
  }

  async function markAsRead(id: string) {
     const supabase = createBrowserClient();
     await supabase.from('notifications').update({ is_read: true }).eq('id', id);
     setNotifications(current => current.map(n => n.id === id ? {...n, is_read: true} : n));
     setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
     const supabase = createBrowserClient();
     if (!profile?.company_id) return;
     
     // Mark all visible for simplicity, or complex query
     const visibleIds = notifications.filter(n => !n.is_read).map(n => n.id);
     if (visibleIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', visibleIds);
        setNotifications(current => current.map(n => ({...n, is_read: true})));
        setUnreadCount(0);
     }
  }

    return (
    <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full text-[#5C5855] hover:bg-[#FAF9F6]"
          onClick={() => setIsOpen(!isOpen)}
        >
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
           )}
        </Button>
      
      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white border-[#E5E0D8] shadow-xl rounded-2xl overflow-hidden z-50">
                <div className="p-3 bg-[#FAF9F6] border-b border-[#E5E0D8] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8A847C] uppercase tracking-widest">Notificações</span>
                    {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary-600 font-bold hover:underline">
                        Marcar todas
                    </button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 text-sm">
                        Nenhuma notificação recente.
                    </div>
                    ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-[#E5E0D8] hover:bg-[#FAF9F6] transition-colors relative ${!n.is_read ? 'bg-primary-50/30' : ''}`}>
                            <div className="flex gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-primary-500' : 'bg-transparent'}`} />
                                <div className="space-y-1 flex-1">
                                <p className="text-sm font-bold text-[#2C2825] leading-tight">{n.title}</p>
                                <p className="text-xs text-[#5C5855] leading-relaxed">{n.message}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] text-neutral-400">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                    </span>
                                    {n.link && (
                                        <Link href={n.link} className="text-[10px] text-primary-600 font-bold flex items-center gap-1 hover:underline">
                                            Ver <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                                </div>
                                {!n.is_read && (
                                <button onClick={() => markAsRead(n.id)} className="text-neutral-300 hover:text-emerald-500">
                                    <Check className="h-4 w-4" />
                                </button>
                                )}
                            </div>
                        </div>
                    ))
                    )}
                </div>
            </div>
        </>
      )}
    </div>
  );
}
