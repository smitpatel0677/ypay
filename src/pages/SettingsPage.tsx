import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  ArrowLeft, Moon, Sun, Bell, Shield, Globe,
  Lock, Eye, EyeOff, LogOut, ChevronRight, AlertCircle, Smartphone
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showPinForm, setShowPinForm] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showPassForm, setShowPassForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  if (!user) return null;

  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault(); setPinError('');
    if (oldPin !== user!.pin) { setPinError('Current PIN is incorrect.'); return; }
    if (newPin.length !== 4) { setPinError('New PIN must be 4 digits.'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match.'); return; }
    await updateUser({ pin: newPin });
    toast.success('Transaction PIN updated!');
    setShowPinForm(false); setOldPin(''); setNewPin(''); setConfirmPin('');
  }

  async function handlePassChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { toast.error('Passwords do not match.'); return; }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated!');
    setShowPassForm(false); setNewPass(''); setConfirmPass('');
  }

  const SETTINGS_SECTIONS: {
    title: string;
    items: {
      icon: React.ElementType;
      label: string;
      value?: string;
      action: () => void;
      toggle?: boolean;
      toggleValue?: boolean;
    }[];
  }[] = [
    {
      title: 'Preferences',
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: 'Dark Mode',
          value: darkMode ? 'On' : 'Off',
          action: () => { setDarkMode(d => !d); toast.info('Theme preference saved (dark mode default).'); },
          toggle: true, toggleValue: darkMode,
        },
        {
          icon: Bell,
          label: 'Push Notifications',
          value: notifEnabled ? 'Enabled' : 'Disabled',
          action: () => { setNotifEnabled(n => !n); toast.info(`Notifications ${!notifEnabled ? 'enabled' : 'disabled'}.`); },
          toggle: true, toggleValue: notifEnabled,
        },
        {
          icon: Globe,
          label: 'Language',
          value: 'English',
          action: () => toast.info('Language settings coming soon.'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Change Transaction PIN',
          action: () => setShowPinForm(s => !s),
        },
        {
          icon: Lock,
          label: 'Change Password',
          action: () => setShowPassForm(s => !s),
        },
        {
          icon: Smartphone,
          label: 'Login History',
          action: () => toast.info('Login history — last access: ' + new Date().toLocaleDateString()),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: AlertCircle,
          label: 'Help & Support',
          action: () => toast.info('Contact: support@yourpay.com'),
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          action: () => toast.info('Privacy policy page coming soon.'),
        },
        {
          icon: Shield,
          label: 'Terms of Service',
          action: () => toast.info('Terms page coming soon.'),
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your preferences</p>
          </div>
        </div>

        {/* PIN change form */}
        {showPinForm && (
          <form onSubmit={handlePinChange} className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
            <h2 className="font-semibold">Change Transaction PIN</h2>
            {[
              { id: 'oldPin', label: 'Current PIN', val: oldPin, set: setOldPin },
              { id: 'newPin', label: 'New PIN', val: newPin, set: setNewPin },
              { id: 'confirmPin', label: 'Confirm New PIN', val: confirmPin, set: setConfirmPin },
            ].map(({ id, label, val, set }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
                <div className="relative">
                  <Input id={id} type={showPins ? 'text' : 'password'} value={val}
                    onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) set(e.target.value); }}
                    className="bg-secondary/50 border-border mono-number pr-10" maxLength={4} required />
                  <button type="button" onClick={() => setShowPins(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            {pinError && <div className="text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/30">{pinError}</div>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setShowPinForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 glow-btn">Update PIN</Button>
            </div>
          </form>
        )}

        {/* Password change form */}
        {showPassForm && (
          <form onSubmit={handlePassChange} className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
            <h2 className="font-semibold">Change Password</h2>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">New Password</Label>
              <Input type="password" placeholder="Min. 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} className="bg-secondary/50 border-border" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Confirm Password</Label>
              <Input type="password" placeholder="Repeat password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="bg-secondary/50 border-border" required />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setShowPassForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 glow-btn">Update Password</Button>
            </div>
          </form>
        )}

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{section.title}</h2>
            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border">
              {section.items.map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.toggle !== undefined ? (
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${item.toggleValue ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${item.toggleValue ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  {item.value && !item.toggle && <span className="text-xs text-muted-foreground">{item.value}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App info */}
        <div className="glass-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">YourPay v1.0.0 · Built by SRP Digital Studios</p>
          <p className="text-xs text-muted-foreground mt-0.5">© 2026 YourPay. All rights reserved.</p>
        </div>

        {/* Logout */}
        <Button variant="ghost" className="w-full gap-2 text-destructive hover:bg-destructive/10 border border-destructive/30"
          onClick={() => { logout(); toast.success('Logged out.'); navigate('/'); }}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </AppLayout>
  );
}
