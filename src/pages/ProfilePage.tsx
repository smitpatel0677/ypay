import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, formatDate } from '@/lib/mockData';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Edit3, Copy, CheckCircle, Camera,
  Wallet, CreditCard, Calendar, Mail, Gift, LogOut, Upload, Share2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout, refreshUser } = useAuth();
  const { getBalance, transactions } = useWallet();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  const mainBal = getBalance('main');
  const savBal = getBalance('savings');
  const rewBal = getBalance('rewards');
  const txns = transactions;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error('Upload failed.'); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateUser({ profilePic: data.publicUrl });
    await refreshUser();
    toast.success('Profile photo updated!');
    setUploadingAvatar(false);
  }

  function handleSave() {
    if (!fullName.trim()) { toast.error('Name cannot be empty.'); return; }
    updateUser({ fullName: fullName.trim() });
    setEditing(false);
    toast.success('Profile updated!');
  }

  function copyUpi() {
    navigator.clipboard.writeText(user!.upiId);
    setCopied(true); toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await logout(); toast.success('Logged out.'); navigate('/');
  }

  const profileData = `yourpay://profile?upi=${user.upiId}&name=${encodeURIComponent(user.fullName)}`;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account details</p>
          </div>
        </div>

        {/* Avatar & name */}
        <div className="glass-card rounded-2xl p-5 border border-border/50 text-center relative">
          <div className="relative inline-block mb-3">
            <img src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              alt={user.fullName} className="w-20 h-20 rounded-full bg-secondary mx-auto object-cover" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-60"
            >
              {uploadingAvatar ? <Upload className="w-3.5 h-3.5 animate-pulse" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          {editing ? (
            <div className="space-y-3">
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-secondary/50 border-border text-center font-semibold" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-border" onClick={() => { setEditing(false); setFullName(user.fullName); }}>Cancel</Button>
                <Button className="flex-1 glow-btn" onClick={handleSave}>Save</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{user.fullName}</h2>
                {user.isVerified && <CheckCircle className="w-4 h-4 text-accent" />}
              </div>
              <p className="text-muted-foreground text-sm font-mono">{user.upiId}</p>
              <button onClick={() => setEditing(true)} className="mt-3 text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <Edit3 className="w-3 h-3" /> Edit Name
              </button>
            </>
          )}
        </div>

        {/* Profile info */}
        <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Calendar, label: 'Date of Birth', value: formatDate(user.dob) },
            { icon: Wallet, label: 'Wallet Number', value: user.walletNumber },
            { icon: Calendar, label: 'Member Since', value: formatDate(user.memberSince) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium truncate">{value}</div>
              </div>
            </div>
          ))}
          {/* UPI with copy */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">UPI ID</div>
              <div className="text-sm font-medium truncate mono-number">{user.upiId}</div>
            </div>
            <button onClick={copyUpi} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Wallet balances */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Main', val: mainBal, icon: Wallet },
            { label: 'Savings', val: savBal, icon: CreditCard },
            { label: 'Rewards', val: rewBal, icon: Gift },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="glass-card p-3 rounded-2xl border border-border/50 text-center h-full">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-sm font-bold mono-number">{formatCurrency(val)}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-2xl border border-border/50 text-center">
            <div className="text-2xl font-bold">{txns.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Transactions</div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-border/50 text-center">
            <div className="text-lg font-bold font-mono break-all">{user.referralCode}</div>
            <div className="text-xs text-muted-foreground mt-1">Referral Code</div>
          </div>
        </div>

        {/* Profile QR */}
        <div className="glass-card p-5 rounded-2xl border border-border/50 text-center">
          <h3 className="font-semibold mb-3 text-sm">Profile QR Code</h3>
          <div className="inline-flex p-3 bg-white rounded-2xl">
            <QRCodeDataUrl text={profileData} width={120} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share your profile QR</p>
          <Button variant="outline" size="sm" className="mt-2 gap-2 border-border" onClick={() => {
            if (navigator.share) navigator.share({ title: user.fullName, text: `Pay me: ${user.upiId}` });
            else { navigator.clipboard.writeText(user.upiId); toast.success('UPI ID copied!'); }
          }}>
            <Share2 className="w-3.5 h-3.5" /> Share Profile
          </Button>
        </div>

        {/* Logout */}
        <Button variant="ghost" className="w-full gap-2 text-destructive hover:bg-destructive/10 border border-destructive/30" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </AppLayout>
  );
}
