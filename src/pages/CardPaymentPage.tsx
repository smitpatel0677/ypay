import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/mockData';
import { SuccessScreen } from './SendMoneyPage';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

export default function CardPaymentPage() {
  const { user } = useAuth();
  const { getBalance } = useWallet();
  const navigate = useNavigate();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm' | 'success'>('enter');
  const [error, setError] = useState('');

  if (!user) return null;
  const balance = getBalance('main');

  function formatCardInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  function formatExpiryInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (cardNumber.replace(/\s/g, '').length !== 16) { setError('Enter a valid 16-digit card number.'); return; }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) { setError('Enter expiry as MM/YY.'); return; }
    if (cvv.length !== 3) { setError('Enter a valid 3-digit CVV.'); return; }
    if (!holderName.trim()) { setError('Enter cardholder name.'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (amt > balance) { setError('Insufficient balance.'); return; }
    setStep('confirm');
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === 'enter' ? navigate('/dashboard') : setStep('enter')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Pay by Card</h1>
            <p className="text-muted-foreground text-sm">YourPay ecosystem card payments only</p>
          </div>
        </div>

        {step === 'enter' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card p-4 rounded-2xl border border-border/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Card Details</h2>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Card Number</Label>
                <Input placeholder="0000 0000 0000 0000" value={cardNumber}
                  onChange={e => setCardNumber(formatCardInput(e.target.value))}
                  className="bg-secondary/50 border-border mono-number text-base" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Expiry (MM/YY)</Label>
                  <Input placeholder="09/28" value={expiry}
                    onChange={e => setExpiry(formatExpiryInput(e.target.value))}
                    className="bg-secondary/50 border-border mono-number" required maxLength={5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">CVV</Label>
                  <Input type="password" placeholder="•••" value={cvv}
                    onChange={e => { if (/^\d{0,3}$/.test(e.target.value)) setCvv(e.target.value); }}
                    className="bg-secondary/50 border-border mono-number" required maxLength={3} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Card Holder Name</Label>
                <Input placeholder="JOHN DOE" value={holderName}
                  onChange={e => setHolderName(e.target.value.toUpperCase())}
                  className="bg-secondary/50 border-border" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <Input type="number" placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7 bg-secondary/50 border-border text-lg mono-number font-bold" min="1" required />
              </div>
              <p className="text-xs text-muted-foreground">Available: {formatCurrency(balance)}</p>
            </div>

            <div className="glass-card p-3 rounded-xl border border-info/30 bg-info/5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-info inline mr-1.5" />
              The card owner will receive a payment request notification and must approve this transaction.
            </div>

            {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            <Button type="submit" className="w-full glow-btn">Continue</Button>
          </form>
        )}

        {step === 'confirm' && (
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-accent" /> Review Payment</h2>
              {[
                { label: 'Card Number', value: cardNumber },
                { label: 'Card Holder', value: holderName },
                { label: 'Expiry', value: expiry },
                { label: 'Amount', value: formatCurrency(parseFloat(amount)) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium mono-number">{value}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-3 rounded-xl border border-warning/30 bg-warning/5 text-xs text-warning">
              The card holder will be notified and must enter their PIN to approve this ₹{parseFloat(amount).toLocaleString('en-IN')} charge.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-border" onClick={() => setStep('enter')}>Edit</Button>
              <Button className="flex-1 glow-btn" onClick={() => { toast.success('Payment request sent! Waiting for card holder approval.'); setStep('success'); }}>Send Request</Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <SuccessScreen amount={parseFloat(amount)} recipientName={holderName} onDone={() => navigate('/dashboard')} />
        )}
      </div>
    </AppLayout>
  );
}
