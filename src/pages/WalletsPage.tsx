import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, formatDate, formatTime, transactionStatusColors, transactionStatusLabels } from '@/lib/mockData';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { toast } from 'sonner';
import {
  ArrowLeft, Wallet, PiggyBank, Gift, Copy, QrCode, ArrowRightLeft,
  ArrowDownLeft, ArrowUpRight, Eye, EyeOff
} from 'lucide-react';

const WALLET_CONFIG = [
  { type: 'main' as const, label: 'Main Wallet', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  { type: 'savings' as const, label: 'Savings Wallet', icon: PiggyBank, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  { type: 'rewards' as const, label: 'Rewards Wallet', icon: Gift, color: 'text-[hsl(280_65%_65%)]', bg: 'bg-[hsl(280_65%_65%_/_0.1)]', border: 'border-[hsl(280_65%_65%_/_0.3)]' },
];

export default function WalletsPage() {
  const { user } = useAuth();
  const { getBalance, transactions, getWallet } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'main' | 'savings' | 'rewards'>('main');
  const [showBalance, setShowBalance] = useState(true);

  if (!user) return null;

  const activeConfig = WALLET_CONFIG.find(w => w.type === activeTab)!;
  const balance = getBalance(activeTab);
  const wallet = getWallet(activeTab);
  const txns = transactions.filter(t => t.walletType === activeTab).slice(0, 8);
  const qrData = wallet ? `yourpay://pay?upi=${wallet.upiId}&wallet=${wallet.walletNumber}` : '';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">My Wallets</h1>
        </div>

        {/* Wallet tabs */}
        <div className="grid grid-cols-3 gap-3">
          {WALLET_CONFIG.map(cfg => {
            const bal = getBalance(cfg.type);
            return (
              <button key={cfg.type} onClick={() => setActiveTab(cfg.type)}
                className={`glass-card p-3 rounded-2xl border-2 transition-all text-left h-full flex flex-col ${activeTab === cfg.type ? cfg.border : 'border-border/50 hover:border-border'}`}
              >
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center mb-2`}>
                  <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="text-xs text-muted-foreground">{cfg.label}</div>
                <div className={`text-sm font-bold mono-number mt-0.5 ${activeTab === cfg.type ? cfg.color : ''}`}>
                  {formatCurrency(bal)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active wallet details */}
        <div className={`glass-card rounded-2xl p-5 border-2 ${activeConfig.border} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${activeConfig.bg} flex items-center justify-center`}>
                <activeConfig.icon className={`w-5 h-5 ${activeConfig.color}`} />
              </div>
              <div>
                <div className="font-semibold">{activeConfig.label}</div>
                {wallet && <div className="text-xs text-muted-foreground mono-number">{wallet.walletNumber}</div>}
              </div>
            </div>
            <button onClick={() => setShowBalance(s => !s)} className="text-muted-foreground hover:text-foreground p-1">
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
            <div className={`text-3xl font-bold mono-number ${activeConfig.color}`}>
              {showBalance ? formatCurrency(balance) : '₹ ••••••'}
            </div>
          </div>

          {wallet && (
            <div className="space-y-2">
              {[
                { label: 'Wallet Number', value: wallet.walletNumber },
                { label: 'UPI ID', value: wallet.upiId },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2.5">
                  <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium mono-number">{value}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* QR Code */}
          {wallet && (
            <div className="flex items-center gap-4 pt-2 border-t border-border/50">
              <div className="p-2 bg-white rounded-xl">
                <QRCodeDataUrl text={qrData} width={64} />
              </div>
              <div>
                <p className="text-sm font-medium">Payment QR Code</p>
                <p className="text-xs text-muted-foreground">Scan to pay this wallet</p>
                <div className="flex gap-2 mt-2">
                  <Link to="/receive">
                    <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs">
                      <QrCode className="w-3 h-3" /> Full QR
                    </Button>
                  </Link>
                  {activeTab !== 'rewards' && (
                    <Link to="/savings">
                      <Button size="sm" variant="outline" className="gap-1.5 border-border text-xs">
                        <ArrowRightLeft className="w-3 h-3" /> Transfer
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions for this wallet */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {activeConfig.label} Transactions
          </h2>
          <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            {txns.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No transactions for this wallet</div>
            ) : (
              <div className="divide-y divide-border">
                {txns.map(txn => {
                  const isCredit = txn.receiverId === user.id;
                  const counterparty = isCredit ? txn.senderName : txn.receiverName;
                  const photo = isCredit ? txn.senderPhoto : txn.receiverPhoto;
                  return (
                    <div key={txn.id} className="flex items-center gap-3 p-4">
                      <div className="relative shrink-0">
                        <img src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${counterparty}`}
                          alt={counterparty} className="w-9 h-9 rounded-full bg-secondary" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${isCredit ? 'bg-accent' : 'bg-destructive'}`}>
                          {isCredit ? <ArrowDownLeft className="w-2 h-2 text-white" /> : <ArrowUpRight className="w-2 h-2 text-white" />}
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
                        <div className={`text-[10px] ${transactionStatusColors[txn.status]}`}>
                          {transactionStatusLabels[txn.status]}
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
