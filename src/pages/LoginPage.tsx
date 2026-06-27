import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Welcome back! 👋');
        navigate('/dashboard');
      } else {
        setError(res.error || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(adminUser, adminPass);
      if (res.success) {
        toast.success('Admin access granted.');
        navigate('/admin');
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('demo@yourpay.com');
    setPassword('demo1234');
    toast.info('Demo credentials filled!');
  }

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">YourPay</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your YourPay account</p>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-2xl p-1 flex mb-6 border border-border">
          <button
            onClick={() => { setTab('user'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${tab === 'user' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            User Login
          </button>
          <button
            onClick={() => { setTab('admin'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${tab === 'admin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Admin Login
          </button>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-6 border border-border/60">
          {tab === 'user' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-normal">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 bg-secondary/50 border-border" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-normal">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 pr-10 bg-secondary/50 border-border" required />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-border" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">Remember me</Label>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <Button type="submit" className="w-full glow-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
              {/* Google OAuth placeholder */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button type="button" variant="outline" className="w-full gap-2 border-border" onClick={() => toast.info('Google OAuth requires backend setup.')}>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
              <Button type="button" variant="ghost" className="w-full text-muted-foreground text-xs border border-border/50 hover:bg-secondary/50" onClick={fillDemo}>
                Use Demo Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Admin access is restricted. Default: admin / admin11
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminUser" className="text-sm font-normal">Username</Label>
                <Input id="adminUser" placeholder="admin" value={adminUser} onChange={e => setAdminUser(e.target.value)} className="bg-secondary/50 border-border" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminPass" className="text-sm font-normal">Password</Label>
                <div className="relative">
                  <Input id="adminPass" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="pr-10 bg-secondary/50 border-border" required />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <Button type="submit" className="w-full glow-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Admin Sign In'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
