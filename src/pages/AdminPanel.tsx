import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate, formatTime, transactionStatusColors, transactionStatusLabels } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Shield, Users, BarChart3, History, Settings, LogOut, Menu,
  Search, Wallet, CreditCard, Bell, TrendingUp,
  CheckCircle, XCircle, Snowflake, Zap, Trash2, RefreshCw,
  ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Minus,
  Download, AlertTriangle, Activity, DollarSign, Send
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AdminTab = 'dashboard' | 'users' | 'transactions' | 'cards' | 'notifications' | 'analytics' | 'logs' | 'settings';

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof Shield }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: History },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'logs', label: 'Audit Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function AdminSidebar({ tab, setTab, onClose }: { tab: AdminTab; setTab: (t: AdminTab) => void; onClose?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full py-4 bg-sidebar">
      <div className="flex items-center gap-2 px-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-destructive/80 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm gradient-text">YourPay Admin</span>
          <div className="text-[10px] text-muted-foreground">Super Admin</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); onClose?.(); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left min-h-[44px] ${tab === id ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{label}</span>
            {tab === id && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
          </button>
        ))}
      </nav>
      <div className="px-3 pt-4 border-t border-sidebar-border mt-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11"
          onClick={async () => { await logout(); toast.success('Logged out.'); navigate('/'); onClose?.(); }}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, transactions: 0, totalBalance: 0, todayTxns: 0, activeCards: 0, frozenCards: 0 });
  const [recentTxns, setRecentTxns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersRes, txnsRes, walletsRes, cardsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('wallets').select('balance'),
        supabase.from('virtual_cards').select('is_frozen'),
      ]);
      const today = new Date().toDateString();
      const txns = txnsRes.data || [];
      const wallets = walletsRes.data || [];
      const cards = cardsRes.data || [];
      setStats({
        users: usersRes.count || 0,
        transactions: txns.length,
        totalBalance: wallets.reduce((s, w) => s + Number(w.balance), 0),
        todayTxns: txns.filter(t => new Date(t.created_at as string).toDateString() === today).length,
        activeCards: cards.filter(c => !c.is_frozen).length,
        frozenCards: cards.filter(c => c.is_frozen).length,
      });
      setRecentTxns(txns as Record<string, unknown>[]);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Total Transactions', value: stats.transactions, icon: History, color: 'text-accent bg-accent/10' },
    { label: 'Platform Balance', value: formatCurrency(stats.totalBalance), icon: Wallet, color: 'text-warning bg-warning/10' },
    { label: "Today's Txns", value: stats.todayTxns, icon: TrendingUp, color: 'text-[hsl(280_65%_65%)] bg-[hsl(280_65%_65%_/_0.1)]' },
    { label: 'Active Cards', value: stats.activeCards, icon: CreditCard, color: 'text-primary bg-primary/10' },
    { label: 'Frozen Cards', value: stats.frozenCards, icon: Snowflake, color: 'text-destructive bg-destructive/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview — live data</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl border border-border/50 h-full flex flex-col">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-muted-foreground text-xs mb-1">{s.label}</div>
            <div className="font-bold text-lg mono-number">{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Transactions</h2>
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  {['TXN ID', 'From', 'To', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTxns.map(t => (
                  <tr key={t.id as string} className="hover:bg-secondary/20 transition-colors text-xs">
                    <td className="px-4 py-3 mono-number text-muted-foreground whitespace-nowrap">{(t.txn_id as string)?.slice(-8)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.sender_name as string}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.receiver_name as string}</td>
                    <td className="px-4 py-3 mono-number font-semibold whitespace-nowrap">{formatCurrency(Number(t.amount))}</td>
                    <td className="px-4 py-3 uppercase whitespace-nowrap">{t.method as string}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={transactionStatusColors[t.status as keyof typeof transactionStatusColors] || ''}>{t.status as string}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(t.created_at as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function AdminUsers() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [newPin, setNewPin] = useState('');
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Record<string, unknown>[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function loadWalletBalances(userId: string) {
    const { data } = await supabase.from('wallets').select('type, balance').eq('user_id', userId);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach(w => { map[w.type] = Number(w.balance); });
      setWalletBalances(map);
    }
  }

  async function selectUser(u: Record<string, unknown>) {
    setSelectedUser(u);
    await loadWalletBalances(u.id as string);
  }

  async function handleCredit() {
    if (!selectedUser || !creditAmount) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('admin_credit_wallet', {
      p_user_id: selectedUser.id,
      p_wallet_type: 'main',
      p_amount: parseFloat(creditAmount),
      p_note: 'Admin credit',
    });
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Credited ₹${creditAmount} to ${selectedUser.full_name}`);
    setCreditAmount('');
    await loadWalletBalances(selectedUser.id as string);
  }

  async function handleDebit() {
    if (!selectedUser || !debitAmount) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('admin_debit_wallet', {
      p_user_id: selectedUser.id,
      p_wallet_type: 'main',
      p_amount: parseFloat(debitAmount),
      p_note: 'Admin debit',
    });
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Debited ₹${debitAmount} from ${selectedUser.full_name}`);
    setDebitAmount('');
    await loadWalletBalances(selectedUser.id as string);
  }

  async function handleFreezeToggle() {
    if (!selectedUser) return;
    const freeze = !selectedUser.is_frozen;
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ is_frozen: freeze }).eq('id', selectedUser.id);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    const updated = { ...selectedUser, is_frozen: freeze };
    setSelectedUser(updated);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
    toast.success(freeze ? 'Account frozen.' : 'Account unfrozen.');
  }

  async function handleResetPin() {
    if (!selectedUser || newPin.length !== 4) { toast.error('Enter a 4-digit PIN.'); return; }
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ pin_hash: newPin }).eq('id', selectedUser.id);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('PIN reset successfully.');
    setNewPin('');
  }

  async function handleDelete() {
    if (!selectedUser) return;
    if (!confirm(`Delete user ${selectedUser.full_name}? This cannot be undone.`)) return;
    setActionLoading(true);
    const { error } = await supabase.auth.admin.deleteUser(selectedUser.id as string);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('User deleted.');
    setSelectedUser(null);
    loadUsers();
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.full_name as string)?.toLowerCase().includes(q)
      || (u.email as string)?.toLowerCase().includes(q)
      || (u.upi_id as string)?.toLowerCase().includes(q)
      || (u.wallet_number as string)?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">{users.length} registered users</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadUsers} className="gap-1.5 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search name, email, UPI, wallet…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border" />
      </div>

      {selectedUser && (
        <div className="glass-card rounded-2xl p-5 border border-primary/30 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={(selectedUser.avatar_url as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                alt={selectedUser.full_name as string} className="w-12 h-12 rounded-full object-cover bg-secondary" />
              <div>
                <div className="font-semibold flex items-center gap-1.5">{selectedUser.full_name as string}
                  {selectedUser.is_verified as boolean && <CheckCircle className="w-3.5 h-3.5 text-accent" />}
                </div>
                <div className="text-xs text-muted-foreground">{selectedUser.email as string}</div>
                <div className="text-xs text-muted-foreground font-mono">{selectedUser.upi_id as string}</div>
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-secondary">Close</button>
          </div>

          {/* Wallet Balances */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {(['main', 'savings', 'rewards'] as const).map(t => (
              <div key={t} className="glass-card p-3 rounded-xl border border-border">
                <div className="text-muted-foreground capitalize mb-1">{t}</div>
                <div className="font-bold mono-number">{formatCurrency(walletBalances[t] ?? 0)}</div>
              </div>
            ))}
          </div>

          {/* Credit / Debit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Add Money (₹)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Amount" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                  className="bg-secondary/50 border-border text-sm" min="1" />
                <Button size="sm" disabled={actionLoading || !creditAmount} onClick={handleCredit}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Debit Money (₹)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Amount" value={debitAmount} onChange={e => setDebitAmount(e.target.value)}
                  className="bg-secondary/50 border-border text-sm" min="1" />
                <Button size="sm" variant="destructive" disabled={actionLoading || !debitAmount} onClick={handleDebit}
                  className="shrink-0 gap-1">
                  <Minus className="w-3.5 h-3.5" /> Debit
                </Button>
              </div>
            </div>
          </div>

          {/* Reset PIN */}
          <div className="space-y-2">
            <Label className="text-xs">Reset Transaction PIN</Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="New 4-digit PIN" value={newPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewPin(e.target.value); }}
                className="bg-secondary/50 border-border text-sm mono-number" maxLength={4} />
              <Button size="sm" variant="outline" disabled={actionLoading || newPin.length !== 4} onClick={handleResetPin} className="shrink-0 border-border">
                Reset PIN
              </Button>
            </div>
          </div>

          {/* Freeze / Delete */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={actionLoading} onClick={handleFreezeToggle}
              className={selectedUser.is_frozen ? 'gap-1.5 bg-accent/10 border-accent text-accent hover:bg-accent/20' : 'gap-1.5 border-warning text-warning hover:bg-warning/10'}>
              {selectedUser.is_frozen ? <><Zap className="w-3.5 h-3.5" /> Unfreeze Account</> : <><Snowflake className="w-3.5 h-3.5" /> Freeze Account</>}
            </Button>
            <Button size="sm" variant="destructive" disabled={actionLoading} onClick={handleDelete} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete User
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {['User', 'UPI ID', 'Wallet No.', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading users…</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id as string} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={(u.avatar_url as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                        alt={u.full_name as string} className="w-7 h-7 rounded-full bg-secondary shrink-0 object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{u.full_name as string}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{u.email as string}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs mono-number whitespace-nowrap">{u.upi_id as string}</td>
                  <td className="px-4 py-3 text-xs mono-number whitespace-nowrap">{u.wallet_number as string}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                      {u.role as string || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_frozen ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'}`}>
                      {u.is_frozen ? 'Frozen' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => selectUser(u)} className="text-xs text-primary hover:underline whitespace-nowrap">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ──────────────────────────────────────────────────────────
function AdminTransactions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [txns, setTxns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(200);
      setTxns((data as Record<string, unknown>[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  function exportCsv() {
    const rows = [['TXN ID', 'From', 'To', 'Amount', 'Method', 'Status', 'Date']];
    filtered.forEach(t => rows.push([
      t.txn_id as string, t.sender_name as string, t.receiver_name as string,
      String(t.amount), t.method as string, t.status as string, formatDate(t.created_at as string)
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'transactions.csv'; a.click();
  }

  const filtered = txns.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || (t.sender_name as string)?.toLowerCase().includes(q)
      || (t.receiver_name as string)?.toLowerCase().includes(q)
      || (t.txn_id as string)?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground text-sm">{txns.length} total transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 border-border text-muted-foreground">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search TXN ID, name…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {['TXN ID', 'From', 'To', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading transactions…</td></tr>
              ) : filtered.slice(0, 100).map(t => (
                <tr key={t.id as string} className="hover:bg-secondary/20 transition-colors text-xs">
                  <td className="px-4 py-3 mono-number text-muted-foreground whitespace-nowrap">{(t.txn_id as string)?.slice(-10)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{t.sender_name as string}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{t.receiver_name as string}</td>
                  <td className="px-4 py-3 mono-number font-semibold whitespace-nowrap">{formatCurrency(Number(t.amount))}</td>
                  <td className="px-4 py-3 uppercase whitespace-nowrap">{t.method as string}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={transactionStatusColors[t.status as keyof typeof transactionStatusColors] || ''}>{t.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(t.created_at as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Cards Tab ────────────────────────────────────────────────────────────────
function AdminCards() {
  const [cards, setCards] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadCards() {
    setLoading(true);
    const { data } = await supabase.from('virtual_cards').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    setCards((data as Record<string, unknown>[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadCards(); }, []);

  async function toggleFreeze(card: Record<string, unknown>) {
    const freeze = !card.is_frozen;
    const { error } = await supabase.from('virtual_cards').update({ is_frozen: freeze }).eq('id', card.id as string);
    if (error) { toast.error(error.message); return; }
    toast.success(freeze ? 'Card frozen.' : 'Card unfrozen.');
    loadCards();
  }

  const filtered = cards.filter(c => {
    const q = search.toLowerCase();
    const profile = c.profiles as Record<string, unknown> | null;
    return !q || (profile?.full_name as string)?.toLowerCase().includes(q)
      || (c.card_number as string)?.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Card Management</h1>
          <p className="text-muted-foreground text-sm">{cards.length} virtual cards</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadCards} className="gap-1.5 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or card number…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border" />
      </div>
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {['User', 'Card Number', 'Expiry', 'Type', 'Limit', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading cards…</td></tr>
              ) : filtered.map(c => {
                const profile = c.profiles as Record<string, unknown> | null;
                return (
                  <tr key={c.id as string} className="hover:bg-secondary/20 transition-colors text-xs">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">{profile?.full_name as string || '—'}</div>
                      <div className="text-muted-foreground text-[10px]">{profile?.email as string || ''}</div>
                    </td>
                    <td className="px-4 py-3 mono-number whitespace-nowrap">•••• {(c.card_number as string)?.slice(-4)}</td>
                    <td className="px-4 py-3 mono-number whitespace-nowrap">{c.expiry as string}</td>
                    <td className="px-4 py-3 uppercase whitespace-nowrap">{c.card_type as string}</td>
                    <td className="px-4 py-3 mono-number whitespace-nowrap">{formatCurrency(Number(c.spending_limit))}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_frozen ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'}`}>
                        {c.is_frozen ? 'Frozen' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => toggleFreeze(c)} className={`text-xs hover:underline ${c.is_frozen ? 'text-accent' : 'text-warning'}`}>
                        {c.is_frozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setRecentNotifs((data as Record<string, unknown>[]) || []));
  }, []);

  async function sendToAll() {
    if (!title.trim() || !message.trim()) { toast.error('Title and message are required.'); return; }
    setSending(true);
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (!profiles) { setSending(false); return; }
    const inserts = profiles.map(p => ({ user_id: p.id, title: title.trim(), message: message.trim(), type, is_read: false }));
    const { error } = await supabase.from('notifications').insert(inserts);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Notification sent to ${profiles.length} users!`);
    setTitle(''); setMessage('');
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    setRecentNotifs((data as Record<string, unknown>[]) || []);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Send Notifications</h1>
        <p className="text-muted-foreground text-sm">Broadcast messages to all users</p>
      </div>
      <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">Notification Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">Title *</Label>
          <Input placeholder="Notification title" value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary/50 border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">Message *</Label>
          <textarea
            placeholder="Notification message…"
            value={message} onChange={e => setMessage(e.target.value)}
            className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm resize-none focus:outline-none focus:border-primary"
          />
        </div>
        <Button onClick={sendToAll} disabled={sending} className="glow-btn gap-2">
          <Send className="w-4 h-4" />{sending ? 'Sending…' : 'Send to All Users'}
        </Button>
      </div>
      {recentNotifs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Broadcasts</h2>
          <div className="glass-card rounded-2xl border border-border/50 divide-y divide-border">
            {recentNotifs.slice(0, 10).map(n => (
              <div key={n.id as string} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{n.title as string}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${n.type === 'warning' ? 'bg-warning/20 text-warning' : n.type === 'success' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>{n.type as string}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AdminAnalytics() {
  const [stats, setStats] = useState({ totalVolume: 0, avgTxn: 0, successRate: 0, topSender: '', topReceiver: '' });
  const [methodBreakdown, setMethodBreakdown] = useState<{ method: string; count: number; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: txns } = await supabase.from('transactions').select('amount, status, method, sender_name, receiver_name');
      if (!txns) return;
      const success = txns.filter(t => t.status === 'success');
      const totalVolume = success.reduce((s, t) => s + Number(t.amount), 0);
      const avgTxn = success.length ? totalVolume / success.length : 0;
      const successRate = txns.length ? Math.round((success.length / txns.length) * 100) : 0;

      const methodMap: Record<string, { count: number; volume: number }> = {};
      txns.forEach(t => {
        if (!methodMap[t.method]) methodMap[t.method] = { count: 0, volume: 0 };
        methodMap[t.method].count++;
        methodMap[t.method].volume += Number(t.amount);
      });
      setMethodBreakdown(Object.entries(methodMap).map(([method, v]) => ({ method, ...v })));

      setStats({ totalVolume, avgTxn, successRate, topSender: success[0]?.sender_name || '—', topReceiver: success[0]?.receiver_name || '—' });
      setLoading(false);
    }
    load();
  }, []);

  const analyticsCards = [
    { label: 'Total Volume', value: formatCurrency(stats.totalVolume), icon: DollarSign, color: 'text-primary bg-primary/10' },
    { label: 'Avg Transaction', value: formatCurrency(stats.avgTxn), icon: BarChart3, color: 'text-accent bg-accent/10' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle, color: 'text-accent bg-accent/10' },
    { label: 'Top Sender', value: stats.topSender, icon: ArrowUpRight, color: 'text-warning bg-warning/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Platform insights and metrics</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analyticsCards.map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl border border-border/50">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-muted-foreground text-xs mb-1">{s.label}</div>
            <div className="font-bold mono-number truncate">{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Method Breakdown</h2>
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  {['Method', 'Transactions', 'Volume', 'Share'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {methodBreakdown.map(m => {
                  const total = methodBreakdown.reduce((s, x) => s + x.count, 0);
                  return (
                    <tr key={m.method} className="hover:bg-secondary/20 transition-colors text-xs">
                      <td className="px-4 py-3 uppercase font-medium whitespace-nowrap">{m.method}</td>
                      <td className="px-4 py-3 mono-number whitespace-nowrap">{m.count}</td>
                      <td className="px-4 py-3 mono-number whitespace-nowrap">{formatCurrency(m.volume)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-primary/20 flex-1 max-w-24">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${total ? Math.round((m.count / total) * 100) : 0}%` }} />
                          </div>
                          <span className="text-muted-foreground">{total ? Math.round((m.count / total) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
function AdminLogs() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setLogs((data as Record<string, unknown>[]) || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">All sensitive actions are logged</p>
      </div>
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {['Time', 'User ID', 'Action', 'Details', 'IP'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading logs…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No audit logs yet.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id as string} className="hover:bg-secondary/20 transition-colors text-xs">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(log.created_at as string)} {formatTime(log.created_at as string)}</td>
                  <td className="px-4 py-3 mono-number text-muted-foreground whitespace-nowrap truncate max-w-[80px]">{(log.user_id as string)?.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium whitespace-nowrap">{log.action as string}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{log.details as string}</td>
                  <td className="px-4 py-3 mono-number text-muted-foreground whitespace-nowrap">{(log.ip_address as string) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">System Settings</h1>
        <p className="text-muted-foreground text-sm">Platform configuration</p>
      </div>
      <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Maintenance Mode</p>
            <p className="text-muted-foreground text-xs">Disable all user transactions</p>
          </div>
          <button onClick={() => { setMaintenanceMode(m => !m); toast.info(maintenanceMode ? 'Maintenance mode OFF.' : 'Maintenance mode ON.'); }}
            className={`relative w-10 h-5 rounded-full transition-colors ${maintenanceMode ? 'bg-destructive' : 'bg-secondary'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Admin Credentials</p>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex gap-2"><span className="text-muted-foreground w-20">Email:</span><span>admin@ypay.com</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-20">Password:</span><span>Admin@YPay2026!</span></div>
          </div>
        </div>
        <div className="border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
          <div className="flex gap-2"><span className="w-32">Supabase Project:</span><span className="font-mono">uuueedoymosuoiikzjfg</span></div>
          <div className="flex gap-2"><span className="w-32">Region:</span><span>us-west-1</span></div>
          <div className="flex gap-2"><span className="w-32">Domain:</span><span>ypay.srpdigitalstudios.qzz.io</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAdmin) {
    navigate('/login');
    return null;
  }

  function renderTab() {
    switch (tab) {
      case 'dashboard':    return <AdminDashboard />;
      case 'users':        return <AdminUsers />;
      case 'transactions': return <AdminTransactions />;
      case 'cards':        return <AdminCards />;
      case 'notifications':return <AdminNotifications />;
      case 'analytics':    return <AdminAnalytics />;
      case 'logs':         return <AdminLogs />;
      case 'settings':     return <AdminSettings />;
      default:             return null;
    }
  }

  return (
    <div className="dark flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar">
        <AdminSidebar tab={tab} setTab={setTab} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <AdminSidebar tab={tab} setTab={setTab} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm gradient-text">YourPay Admin</span>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
