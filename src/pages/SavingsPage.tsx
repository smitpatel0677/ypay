import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/mockData';
import { PinKeypad, SuccessScreen } from './SendMoneyPage';
import { toast } from 'sonner';
import { ArrowLeft, PiggyBank, TrendingUp, TrendingDown, Target, History, ArrowRightLeft } from 'lucide-react';

const GOALS = [
  { id: 'g1', name: 'Emergency Fund', target: 50000, current: 25000, color: 'text-primary bg-primary/10' },
  { id: 'g2', name: 'Vacation', target: 30000, current: 10000, color: 'text-accent bg-accent/10' },
  { id: 'g3', name: 'New Laptop', target: 80000, current: 55000, color: 'text-warning bg-warning/10' },
];

export default function SavingsPage() {
  const { user } = useAuth();
  const { getBalance, transferToSavings } = useWallet();
  const navigate = useNavigate();

  const [direction, setDirection] = useState<'toSavings' | 'fromSavings'>('toSavings');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'pin' | 'success'>('form');
  const [error, setError] = useState('');

  if (!user) return null;
  const mainBal = getBalance('main');
  const savBal = getBalance('savings');

  function handleForm(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    const avail = direction === 'toSavings' ? mainBal : savBal;
    if (amt > avail) { setError('Insufficient balance.'); return; }
    setStep('pin');
  }

  async function handlePin(pin: string) {
    const res = await transferToSavings(parseFloat(amount), direction === 'toSavings', pin);
    if (res.success) { setStep('success'); toast.success('Transfer successful!'); }
    else { toast.error(res.error || 'Transfer failed.'); setStep('form'); }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Savings Wallet</h1>
            <p className="text-muted-foreground text-sm">Grow your savings, achieve your goals</p>
          </div>
        </div>

        {step === 'success' && (
          <SuccessScreen
            amount={parseFloat(amount)}
            recipientName={direction === 'toSavings' ? 'Savings Wallet' : 'Main Wallet'}
            onDone={() => { setStep('form'); setAmount(''); }}
          />
        )}

        {step !== 'success' && (
          <>
            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Main Wallet</span>
                </div>
                <div className="font-bold mono-number">{formatCurrency(mainBal)}</div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-accent/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-xs text-muted-foreground">Savings</span>
                </div>
                <div className="font-bold mono-number text-accent">{formatCurrency(savBal)}</div>
              </div>
            </div>

            {/* Transfer form */}
            {step === 'form' && (
              <div className="glass-card rounded-2xl p-5 border border-border/50">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-primary" /> Transfer</h2>

                <div className="flex gap-2 mb-4">
                  {([['toSavings', 'Main → Savings'], ['fromSavings', 'Savings → Main']] as const).map(([dir, label]) => (
                    <button key={dir} onClick={() => { setDirection(dir); setError(''); }}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${direction === dir ? 'bg-primary text-primary-foreground' : 'glass-card border border-border text-muted-foreground hover:text-foreground'}`}
                    >{label}</button>
                  ))}
                </div>

                <form onSubmit={handleForm} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Amount (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                      <Input type="number" placeholder="0.00" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="pl-7 bg-secondary/50 border-border text-lg mono-number font-bold" min="1" required />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: {formatCurrency(direction === 'toSavings' ? mainBal : savBal)}
                    </p>
                  </div>
                  {error && <div className="text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/30">{error}</div>}
                  <Button type="submit" className="w-full glow-btn gap-2">
                    <ArrowRightLeft className="w-4 h-4" /> Transfer
                  </Button>
                </form>
              </div>
            )}

            {step === 'pin' && (
              <div className="glass-card rounded-2xl p-6 border border-border/50">
                <PinKeypad title="Confirm Transfer" subtitle="Enter PIN to authorize" onComplete={handlePin} onBack={() => setStep('form')} />
              </div>
            )}

            {/* Savings Goals */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> Savings Goals
              </h2>
              <div className="space-y-3">
                {GOALS.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.id} className="glass-card p-4 rounded-2xl border border-border/50 h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${goal.color} flex items-center justify-center`}>
                            <Target className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.current)}</span>
                        <span>Target: {formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
