import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, formatDate, formatTime, transactionStatusColors, transactionStatusLabels } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send, QrCode, CreditCard, PiggyBank, History, ArrowDownLeft,
  ArrowUpRight, Bell, Eye, EyeOff, Wallet, Gift, TrendingUp,
  TrendingDown, Settings, RefreshCw, Scan, MessageCircle
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Send', icon: Send, path: '/send', color: 'text-primary bg-primary/10' },
  { label: 'Receive', icon: ArrowDownLeft, path: '/receive', color: 'text-accent bg-accent/10' },
  { label: 'Scan QR', icon: Scan, path: '/send?method=qr', color: 'text-[hsl(199_89%_52%)] bg-[hsl(199_89%_52%_/_0.1)]' },
  { label: 'My QR', icon: QrCode, path: '/receive', color: 'text-[hsl(280_65%_65%)] bg-[hsl(280_65%_65%_/_0.1)]' },
  { label: 'Card', icon: CreditCard, path: '/card', color: 'text-[hsl(38_92%_52%)] bg-[hsl(38_92%_52%_/_0.1)]' },
  { label: 'Savings', icon: PiggyBank, path: '/savings', color: 'text-accent bg-accent/10' },
  { label: 'History', icon: History, path: '/transactions', color: 'text-muted-foreground bg-muted' },
  { label: 'Request', icon: MessageCircle, path: '/send', color: 'text-primary bg-primary/10' },
  { label: 'Pay Card', icon: CreditCard, path: '/pay-card', color: 'text-[hsl(38_92%_52%)] bg-[hsl(38_92%_52%_/_0.1)]' },
  { label: 'Settings', icon: Settings, path: '/settings', color: 'text-muted-foreground bg-muted' },
];

function WalletCard({ label, balance, icon: Icon, color, loading }: {
  label: string; balance: number; icon: typeof Wallet; color: string; loading: boolean;
}) {
  const [show, setShow] = useState(true);
  return (
    <div className="glass-card p-4 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <button onClick={() => setShow(s => !s)} className="text-muted-foreground hover:text-foreground p-1">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        {loading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <div className="text-xl font-bold mono-number text-foreground">
            {show ? formatCurrency(balance) : '₹ ••••••'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { getBalance, transactions, getTodaySpending, getMonthlySpending, notifications, getUnreadCount, getPendingRequests, markRead, loadingWallets } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Simulate real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const mainBalance = getBalance('main');
  const savBalance = getBalance('savings');
  const rewBalance = getBalance('rewards');
  const todaySpend = getTodaySpending();
  const monthSpend = getMonthlySpending();
  const recentTxns = transactions.filter(t => t.senderId === user.id || t.receiverId === user.id).slice(0, 5);
  const recentNotifs = notifications.filter(n => !n.isRead).slice(0, 3);
  const unread = getUnreadCount();
  const pendingReqs = getPendingRequests();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">
              {greeting}, {user.fullName.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Welcome back to YourPay</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-warning animate-pulse' : 'bg-accent'}`} title="Live updates" />
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Payment Request Alert */}
        {pendingReqs.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border border-warning/40 bg-warning/5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-warning" />
              </div>
              <div>
                <div className="text-sm font-semibold">Card Payment Request</div>
                <div className="text-xs text-muted-foreground">{pendingReqs[0].requesterName} wants to charge {formatCurrency(pendingReqs[0].amount)}</div>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/card')} className="shrink-0">Review</Button>
          </div>
        )}

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WalletCard label="Main Wallet" balance={mainBalance} icon={Wallet} color="text-primary bg-primary/10" loading={loading} />
          <WalletCard label="Savings Wallet" balance={savBalance} icon={PiggyBank} color="text-accent bg-accent/10" loading={loadingWallets} />
          <WalletCard label="Rewards Wallet" balance={rewBalance} icon={Gift} color="text-[hsl(280_65%_65%)] bg-[hsl(280_65%_65%_/_0.1)]" loading={loadingWallets} />
        </div>

        {/* Spending Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-border/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Today's Spending</div>
              {loading ? <Skeleton className="h-5 w-20 mt-1" /> : (
                <div className="font-bold text-sm mono-number">{formatCurrency(todaySpend)}</div>
              )}
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-border/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">This Month</div>
              {loading ? <Skeleton className="h-5 w-20 mt-1" /> : (
                <div className="font-bold text-sm mono-number">{formatCurrency(monthSpend)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {QUICK_ACTIONS.map(({ label, icon: Icon, path, color }) => (
              <Link key={label} to={path} className="flex flex-col items-center gap-1.5 group">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground text-center group-hover:text-foreground transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <RefreshCw className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet</div>
            ) : (
              <div className="divide-y divide-border">
                {recentTxns.map(txn => {
                  const isCredit = txn.receiverId === user.id;
                  const counterparty = isCredit ? txn.senderName : txn.receiverName;
                  const photo = isCredit ? txn.senderPhoto : txn.receiverPhoto;
                  return (
                    <div key={txn.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                      <div className="relative shrink-0">
                        <img src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${counterparty}`} alt={counterparty} className="w-10 h-10 rounded-full bg-secondary" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isCredit ? 'bg-accent' : 'bg-destructive'}`}>
                          {isCredit ? <ArrowDownLeft className="w-2.5 h-2.5 text-white" /> : <ArrowUpRight className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{counterparty}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(txn.date)} · {formatTime(txn.date)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-semibold mono-number text-sm ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                        </div>
                        <div className={`text-[10px] ${transactionStatusColors[txn.status as keyof typeof transactionStatusColors] || ''}`}>
                          {transactionStatusLabels[txn.status as keyof typeof transactionStatusLabels] || txn.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
