import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { Copy, Download, Share2, ArrowLeft, QrCode, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceiveMoneyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dynamicAmount, setDynamicAmount] = useState('');
  const [qrType, setQrType] = useState<'static' | 'dynamic'>('static');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const staticData = `yourpay://pay?upi=${user.upiId}&wallet=${user.walletNumber}`;
  const dynamicData = dynamicAmount
    ? `yourpay://pay?upi=${user.upiId}&amount=${dynamicAmount}`
    : staticData;
  const qrData = qrType === 'static' ? staticData : dynamicData;

  function copyUpi() {
    navigator.clipboard.writeText(user!.upiId);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function copyWallet() {
    navigator.clipboard.writeText(user!.walletNumber);
    toast.success('Wallet number copied!');
  }

  function shareQr() {
    if (navigator.share) {
      navigator.share({ title: 'Pay me via YourPay', text: `Pay to ${user!.upiId}` });
    } else {
      toast.info('Sharing requires a mobile browser.');
    }
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Receive Money</h1>
            <p className="text-muted-foreground text-sm">Share your QR or UPI to get paid</p>
          </div>
        </div>

        {/* QR Type Toggle */}
        <div className="glass-card rounded-xl p-1 flex mb-5 border border-border">
          {(['static', 'dynamic'] as const).map(t => (
            <button key={t} onClick={() => setQrType(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${qrType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'static' ? 'Static QR' : 'Dynamic QR'}
            </button>
          ))}
        </div>

        {/* Dynamic amount input */}
        {qrType === 'dynamic' && (
          <div className="space-y-1.5 mb-5">
            <Label htmlFor="dynAmount" className="text-sm font-normal">Amount to Request (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
              <Input id="dynAmount" type="number" placeholder="Enter amount" value={dynamicAmount}
                onChange={e => setDynamicAmount(e.target.value)}
                className="pl-7 bg-secondary/50 border-border text-base mono-number" />
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="glass-card rounded-2xl p-6 border border-border/50 text-center mb-4">
          <div className="inline-flex p-3 bg-white rounded-2xl mb-4">
            <QRCodeDataUrl text={qrData} width={180} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <p className="font-semibold text-sm">{user.fullName}</p>
              {user.isVerified && <CheckCircle className="w-3.5 h-3.5 text-accent" />}
            </div>
            <p className="text-primary text-xs font-mono">{user.upiId}</p>
            {qrType === 'dynamic' && dynamicAmount && (
              <p className="text-lg font-bold mono-number text-accent">₹{parseFloat(dynamicAmount).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-5">
          <Button variant="outline" className="flex-1 gap-2 border-border" onClick={shareQr}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button className="flex-1 gap-2 glow-btn" onClick={() => toast.info('Download saves QR as image — requires backend integration.')}>
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>

        {/* UPI & Wallet info */}
        <div className="space-y-3">
          {[
            { label: 'UPI ID', value: user.upiId, onCopy: copyUpi },
            { label: 'Wallet Number', value: user.walletNumber, onCopy: copyWallet },
          ].map(({ label, value, onCopy }) => (
            <div key={label} className="glass-card rounded-xl p-4 border border-border/50 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium mono-number mt-0.5 truncate">{value}</div>
              </div>
              <button onClick={onCopy} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                {copied && label === 'UPI ID' ? <CheckCircle className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
