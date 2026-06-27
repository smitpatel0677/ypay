import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, maskCardNumber } from '@/lib/mockData';
import { PinKeypad } from './SendMoneyPage';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Copy, Snowflake, RefreshCw, ArrowLeft,
  CreditCard, CheckCircle, Lock, Zap, ShieldCheck
} from 'lucide-react';

export default function VirtualCardPage() {
  const { user } = useAuth();
  const { getWallet, freezeCard, unfreezeCard, replaceCard, getPendingRequests, acceptPaymentRequest, rejectPaymentRequest, getBalance, card } = useWallet();
  const navigate = useNavigate();

  const [showNumber, setShowNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [pinMode, setPinMode] = useState<'cvv' | 'freeze' | 'replace' | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [pinForReq, setPinForReq] = useState<string | null>(null);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  if (!user) return null;
  const pendingReqs = getPendingRequests();
  const balance = getBalance('main');

  if (!card) return (
    <AppLayout>
      <div className="text-center py-20 text-muted-foreground">
        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No virtual card found. Please contact support.</p>
      </div>
    </AppLayout>
  );

  function handlePin(pin: string) {
    if (!user) return;
    if (pinMode === 'cvv') {
      setShowCvv(true); setPinMode(null);
      toast.success('CVV revealed. Keep it safe!');
      return;
    }
    const action = pinMode === 'freeze' ? (card!.isFrozen ? unfreezeCard(pin) : freezeCard(pin)) : replaceCard(pin);
    (action as Promise<{ success: boolean; error?: string }>).then(res => {
      if (res.success) {
        setPinMode(null);
        toast.success(pinMode === 'freeze' ? (card!.isFrozen ? 'Card unfrozen!' : 'Card frozen!') : 'New card generated!');
      } else {
        toast.error(res.error || 'Incorrect PIN');
        setPinMode(null);
      }
    });
  }

  async function handleAcceptReq(pin: string) {
    if (!activeReqId) return;
    const res = await acceptPaymentRequest(activeReqId, pin);
    if (res.success) { toast.success('Payment approved!'); setActiveReqId(null); setPinForReq(null); }
    else { toast.error(res.error); setActiveReqId(null); setPinForReq(null); }
  }

  async function handleRejectReq(id: string) {
    await rejectPaymentRequest(id);
    toast.info('Payment request rejected.');
  }

  const cardGradients = {
    midnight: 'from-[#0f1923] via-[#1a2744] to-[#0d1f3c]',
    ocean: 'from-[#0c1f3f] via-[#0d3b6e] to-[#0a2550]',
    sunset: 'from-[#1a0a1f] via-[#2d1b4e] to-[#1a0f2e]',
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Virtual Card</h1>
            <p className="text-muted-foreground text-sm">Valid only within YourPay ecosystem</p>
          </div>
        </div>

        {/* PIN overlay */}
        {pinMode && (
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <PinKeypad
              title={pinMode === 'cvv' ? 'Reveal CVV' : pinMode === 'freeze' ? 'Confirm Freeze' : 'Confirm Replace'}
              subtitle="Enter your 4-digit transaction PIN"
              onComplete={handlePin}
              onBack={() => setPinMode(null)}
            />
          </div>
        )}

        {/* Card display */}
        {!pinMode && (
          <>
            <div
              className="relative cursor-pointer select-none"
              style={{ perspective: '1000px' }}
              onClick={() => setFlipped(f => !f)}
            >
              <div style={{ transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} className="relative">
                {/* Front */}
                <div className={`payment-card bg-gradient-to-br ${cardGradients[card.theme]} p-6 aspect-[1.586/1] flex flex-col justify-between`}
                  style={{ backfaceVisibility: 'hidden' }}>
                  {card.isFrozen && (
                    <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center">
                        <Snowflake className="w-8 h-8 text-[hsl(199_89%_52%)] mx-auto mb-2" />
                        <p className="text-white font-semibold text-sm">Card Frozen</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/80 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white/90 text-sm font-bold">YourPay</span>
                    </div>
                    <div className="w-11 h-7 rounded bg-yellow-400/80 flex items-center justify-center grid grid-cols-2 gap-0.5 p-1">
                      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-yellow-700/60 rounded-sm" />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] mb-1 tracking-widest font-mono">CARD NUMBER</p>
                    <p className="text-white font-mono text-base md:text-lg tracking-widest">
                      {showNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/40 text-[9px] mb-0.5">CARD HOLDER</p>
                      <p className="text-white text-xs font-semibold">{card.holderName}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[9px] mb-0.5">EXPIRES</p>
                      <p className="text-white text-xs font-mono">{card.expiryMonth}/{card.expiryYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[9px]">Ecosystem Only</p>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div className={`payment-card bg-gradient-to-br ${cardGradients[card.theme]} p-6 aspect-[1.586/1] flex flex-col justify-center`}
                  style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}>
                  <div className="w-full h-10 bg-black/60 my-4 rounded" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">CVV</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-base bg-white/10 px-4 py-1 rounded">
                        {showCvv ? card.cvv : '•••'}
                      </span>
                      <button onClick={e => { e.stopPropagation(); if (!showCvv) setPinMode('cvv'); else setShowCvv(false); }}
                        className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
                        {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-white/40 text-[9px] mt-4 text-center">YourPay Virtual Card — For use within YourPay ecosystem only</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">Tap card to flip</p>

            {/* Card Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowNumber(s => !s); }}
                className="glass-card p-3 rounded-xl border border-border/50 flex items-center gap-2 text-sm hover:border-primary/30 transition-all"
              >
                {showNumber ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                {showNumber ? 'Hide Number' : 'Show Number'}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(card.cardNumber); toast.success('Card number copied!'); }}
                className="glass-card p-3 rounded-xl border border-border/50 flex items-center gap-2 text-sm hover:border-primary/30 transition-all"
              >
                <Copy className="w-4 h-4 text-primary" /> Copy Number
              </button>
              <button
                onClick={() => setPinMode('cvv')}
                className="glass-card p-3 rounded-xl border border-border/50 flex items-center gap-2 text-sm hover:border-primary/30 transition-all"
              >
                <Lock className="w-4 h-4 text-warning" /> Show CVV
              </button>
              <button
                onClick={() => setPinMode(card.isFrozen ? null : 'freeze')}
                disabled={card.isFrozen}
                className="glass-card p-3 rounded-xl border border-border/50 flex items-center gap-2 text-sm hover:border-primary/30 transition-all disabled:opacity-50"
              >
                <Snowflake className="w-4 h-4 text-[hsl(199_89%_52%)]" />
                {card.isFrozen ? 'Card Frozen' : 'Freeze Card'}
              </button>
              {card.isFrozen && (
                <button onClick={() => { unfreezeCard(card.id); toast.success('Card unfrozen!'); }}
                  className="glass-card p-3 rounded-xl border border-accent/50 flex items-center gap-2 text-sm text-accent col-span-2"
                >
                  <Zap className="w-4 h-4" /> Unfreeze Card
                </button>
              )}
              <button
                onClick={() => setPinMode('replace')}
                className="glass-card p-3 rounded-xl border border-border/50 flex items-center gap-2 text-sm hover:border-destructive/30 transition-all text-muted-foreground col-span-2"
              >
                <RefreshCw className="w-4 h-4" /> Replace Card (generates new card)
              </button>
            </div>

            {/* Ecosystem notice */}
            <div className="glass-card p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning">YourPay Ecosystem Only</p>
                <p className="text-xs text-muted-foreground mt-0.5">This virtual card is exclusively valid within the YourPay platform. It cannot be used on external payment gateways or third-party services.</p>
              </div>
            </div>

            {/* Pending Payment Requests */}
            {pendingReqs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Payment Requests</h2>
                {pendingReqs.map(req => (
                  <div key={req.id} className="glass-card rounded-2xl p-4 border border-warning/40 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <span className="text-warning font-bold">{req.requesterName[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{req.requesterName}</p>
                        <p className="text-xs text-muted-foreground">{req.requesterUpi}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold mono-number">{formatCurrency(req.amount)}</p>
                        <p className="text-xs text-muted-foreground">Via Card</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Someone wants to charge {formatCurrency(req.amount)} using your YourPay Card.
                    </p>
                    {activeReqId === req.id ? (
                      <PinKeypad title="Authorize Payment" subtitle="Enter PIN to approve" onComplete={handleAcceptReq} onBack={() => setActiveReqId(null)} />
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleRejectReq(req.id)}>Reject</Button>
                        <Button className="flex-1 glow-btn" onClick={() => setActiveReqId(req.id)}>Accept & Pay</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
