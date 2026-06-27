import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatDate, formatTime } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  ArrowLeft, Bell, BellOff, Trash2, CreditCard, Gift,
  Shield, Megaphone, ArrowDownLeft, ArrowUpRight, Tag, CheckCheck
} from 'lucide-react';
import type { Notification } from '@/lib/mockData';

const TYPE_CONFIG: Record<Notification['type'], { icon: typeof Bell; color: string; bg: string }> = {
  money_received: { icon: ArrowDownLeft, color: 'text-accent', bg: 'bg-accent/10' },
  money_sent: { icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/10' },
  card_request: { icon: CreditCard, color: 'text-warning', bg: 'bg-warning/10' },
  card_approved: { icon: CreditCard, color: 'text-accent', bg: 'bg-accent/10' },
  card_declined: { icon: CreditCard, color: 'text-destructive', bg: 'bg-destructive/10' },
  refund: { icon: Gift, color: 'text-accent', bg: 'bg-accent/10' },
  admin_credit: { icon: Gift, color: 'text-accent', bg: 'bg-accent/10' },
  admin_debit: { icon: ArrowUpRight, color: 'text-destructive', bg: 'bg-destructive/10' },
  offer: { icon: Tag, color: 'text-warning', bg: 'bg-warning/10' },
  announcement: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  security: { icon: Shield, color: 'text-destructive', bg: 'bg-destructive/10' },
  login: { icon: Shield, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, markAllRead, markRead, deleteNotif, getUnreadCount } = useWallet();
  const navigate = useNavigate();

  if (!user) return null;
  const notifs = notifications;
  const unread = getUnreadCount();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Notifications
                {unread > 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{unread} new</span>}
              </h1>
              <p className="text-muted-foreground text-sm">{notifs.length} total notifications</p>
            </div>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground text-xs"
              onClick={() => { markAllRead(); toast.success('All marked as read.'); }}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border">
            {notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${n.isRead ? 'hover:bg-secondary/20' : 'bg-primary/5 hover:bg-primary/10'}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{formatDate(n.date)} at {formatTime(n.date)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotif(n.id); toast.info('Notification deleted.'); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
