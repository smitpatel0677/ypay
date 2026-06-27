import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/db/supabase';
import { formatCurrency } from '@/lib/mockData';
import type { Transaction } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Search, Send, QrCode, Wallet, CreditCard, ArrowLeft,
  CheckCircle, XCircle, ArrowUpRight, User, Loader2
} from 'lucide-react';

// PIN Keypad Component
export function PinKeypad({ onComplete, title, subtitle, onBack }: {
  onComplete: (pin: string) => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const MAX = 4;

  function handleKey(k: string) {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= MAX) return;
    const next = pin + k;
    setPin(next);
    if (next.length === MAX) {
      setTimeout(() => onComplete(next), 100);
    }
  }

  return (
    <div className={`flex flex-col items-center gap-6 ${shake ? 'animate-shake' : ''}`}>
      {title && <div className="text-center">
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>}
      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: MAX }).map((_, i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>
      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleKey(String(n))}
            className="ripple h-16 rounded-2xl glass-card text-xl font-bold hover:bg-primary/20 hover:text-primary transition-all active:scale-95 border border-border/50"
          >{n}</button>
        ))}
        <div />
        <button onClick={() => handleKey('0')}
          className="ripple h-16 rounded-2xl glass-card text-xl font-bold hover:bg-primary/20 hover:text-primary transition-all active:scale-95 border border-border/50"
        >0</button>
        <button onClick={() => handleKey('del')}
          className="h-16 rounded-2xl glass-card text-sm font-bold hover:bg-destructive/20 hover:text-destructive transition-all active:scale-95 border border-border/50"
        >⌫</button>
      </div>
      {onBack && (
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}
    </div>
  );
}

// Success Screen Component
export function SuccessScreen({ amount, recipientName, txnId, onDone }: {
  amount: number; recipientName: string; txnId?: string; onDone: () => void;
}) {
  const [confetti, setConfetti] = useState(true);
  useEffect(() => { const t = setTimeout(() => setConfetti(false), 3000); return () => clearTimeout(t); }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] gap-6 overflow-hidden">
      {confetti && Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444'][i % 5],
            animation: `confetti-fall ${1.5 + Math.random()}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.8}s`,
          }}
        />
      ))}
      {/* Animated checkmark */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center animate-scale-in glow-success">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-accent" strokeWidth={1.5} />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
      </div>
      <div className="text-center space-y-2 animate-slide-up">
        <p className="text-muted-foreground text-sm">Payment Successful!</p>
        <div className="text-4xl font-bold gradient-text mono-number">{formatCurrency(amount)}</div>
        <p className="text-muted-foreground">sent to <span className="text-foreground font-semibold">{recipientName}</span></p>
        {txnId && <p className="text-xs text-muted-foreground font-mono">{txnId}</p>}
      </div>
      <Button onClick={onDone} className="glow-btn px-10">Done</Button>
    </div>
  );
}

const METHODS = [
  { id: 'upi', label: 'UPI ID', icon: Send },
  { id: 'wallet', label: 'Wallet No.', icon: Wallet },
  { id: 'qr', label: 'QR Scan', icon: QrCode },
  { id: 'card', label: 'Card', icon: CreditCard },
];

export default function SendMoneyPage() {
  const { user } = useAuth();
  const { sendMoney, getBalance } = useWallet();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [method, setMethod] = useState<string>(searchParams.get('method') || 'upi');
  const [searchQ, setSearchQ] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id?: string; fullName: string; upiId: string; profilePic?: string; isVerified?: boolean } | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'search' | 'amount' | 'pin' | 'processing' | 'success'>('search');
  const [txnId, setTxnId] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; fullName: string; upiId: string; profilePic: string; isVerified: boolean }[]>([]);

  if (!user) return null;
  const balance = getBalance('main');

  async function searchUsers(q: string) {
    if (q.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, upi_id, avatar_url, wallet_number')
      .neq('id', user!.id)
      .or(`upi_id.ilike.%${q}%,full_name.ilike.%${q}%,wallet_number.ilike.%${q}%`)
      .limit(5);
    setSearching(false);
    if (data) {
      setSuggestions(data.map(d => ({
        id: d.id,
        fullName: d.full_name || '',
        upiId: d.upi_id || '',
        profilePic: d.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
        isVerified: true,
      })));
    }
  }

  function handleSelectUser(u: typeof suggestions[0]) {
    setSelectedUser(u);
    setSearchQ(u.upiId);
    setSuggestions([]);
    setStep('amount');
    setError('');
  }

  function handleAmountNext(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (amt > balance) { setError('Insufficient balance in Main Wallet.'); return; }
    setStep('pin');
  }

  async function handlePin(pin: string) {
    if (!selectedUser) return;
    setStep('processing');
    const res = await sendMoney({
      receiverUpi: selectedUser.upiId,
      receiverName: selectedUser.fullName,
      amount: parseFloat(amount),
      method: method as Transaction['method'],
      note,
      pin,
    });
    if (res.success) {
      setTxnId(res.txnId || '');
      setStep('success');
      toast.success('Payment sent successfully!');
    } else {
      toast.error(res.error || 'Payment failed.');
      setStep('pin');
    }
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === 'search' ? navigate('/dashboard') : setStep(s => s === 'amount' ? 'search' : s === 'pin' ? 'amount' : 'search')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Send Money</h1>
            <p className="text-muted-foreground text-sm">Available: {formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Method tabs */}
        {step === 'search' && (
          <>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => { setMethod(m.id); setError(''); setSearchQ(''); setSelectedUser(null); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${method === m.id ? 'bg-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground border border-border'}`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>

            {method === 'qr' ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-border/50">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Camera QR scanning requires a device camera.</p>
                <p className="text-xs text-muted-foreground mt-2">Switch to UPI ID to send money manually.</p>
                <Button variant="outline" className="mt-4" onClick={() => setMethod('upi')}>Use UPI ID Instead</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={method === 'upi' ? 'Search by UPI ID or name…' : method === 'wallet' ? 'Enter wallet number…' : 'Enter card number…'}
                    value={searchQ}
                    onChange={e => { setSearchQ(e.target.value); setSelectedUser(null); setStep('search'); searchUsers(e.target.value); }}
                    className="pl-9 bg-secondary/50 border-border"
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                    {suggestions.map(u => (
                      <button key={u.id} onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0"
                      >
                        <img src={u.profilePic} alt={u.fullName} className="w-10 h-10 rounded-full bg-secondary object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{u.fullName}</span>
                            {u.isVerified && <CheckCircle className="w-3.5 h-3.5 text-accent" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.upiId}</div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                {searchQ.length > 1 && !searching && suggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No users found
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Amount step */}
        {step === 'amount' && selectedUser && (
          <form onSubmit={handleAmountNext} className="space-y-5">
            {/* Recipient card */}
            <div className="glass-card rounded-2xl p-4 border border-border/50 flex items-center gap-3">
              <img src={selectedUser.profilePic} alt={selectedUser.fullName} className="w-12 h-12 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{selectedUser.fullName}</span>
                  {selectedUser.isVerified && <CheckCircle className="w-3.5 h-3.5 text-accent" />}
                </div>
                <div className="text-sm text-muted-foreground">{selectedUser.upiId}</div>
              </div>
              <button type="button" onClick={() => { setStep('search'); setSelectedUser(null); setSearchQ(''); }} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Quick amounts */}
            <div>
              <Label className="text-sm font-normal mb-2 block">Quick Amount</Label>
              <div className="flex gap-2 flex-wrap">
                {[100, 200, 500, 1000, 2000].map(a => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${amount === String(a) ? 'bg-primary text-primary-foreground' : 'glass-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >₹{a.toLocaleString()}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-normal">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  className="pl-7 bg-secondary/50 border-border text-lg mono-number font-bold" min="1" step="0.01" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm font-normal">Note (optional)</Label>
              <Input id="note" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} className="bg-secondary/50 border-border" />
            </div>

            {error && <div className="text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/30">{error}</div>}
            <Button type="submit" className="w-full glow-btn">Continue</Button>
          </form>
        )}

        {/* PIN step */}
        {step === 'pin' && selectedUser && (
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="text-center mb-4">
              <p className="text-muted-foreground text-sm">Sending</p>
              <p className="text-3xl font-bold mono-number gradient-text">{formatCurrency(parseFloat(amount))}</p>
              <p className="text-sm text-muted-foreground mt-1">to {selectedUser.fullName}</p>
            </div>
            <PinKeypad title="Enter Transaction PIN" subtitle="4-digit PIN to authorize payment" onComplete={handlePin} onBack={() => setStep('amount')} />
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Send className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold">Processing Payment</p>
              <p className="text-muted-foreground text-sm">Please wait…</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && selectedUser && (
          <SuccessScreen
            amount={parseFloat(amount)}
            recipientName={selectedUser.fullName}
            txnId={txnId}
            onDone={() => navigate('/dashboard')}
          />
        )}
      </div>
    </AppLayout>
  );
}
