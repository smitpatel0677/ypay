import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowLeft, ArrowRight, Mail, Lock, User, Calendar, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_9m2jhrm';
const EMAILJS_TEMPLATE_ID = 'template_ng47mgy';
const EMAILJS_PUBLIC_KEY  = '911PaP_ohTEL--HIZs5gh';

const STEPS = ['Email', 'Verify OTP', 'Password', 'Profile'];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-primary border-primary text-primary-foreground' : i === step ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="hidden md:inline text-xs font-medium">{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-px max-w-8 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />{msg}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentOtp, setSentOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function sendOtpEmail(toEmail: string, code: string) {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { to_email: toEmail, otp_code: code, to_name: toEmail.split('@')[0] },
      EMAILJS_PUBLIC_KEY
    );
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email.'); return; }
    setLoading(true); setError('');
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(generated);
    try {
      await sendOtpEmail(email, generated);
      toast.success('OTP sent to your email!');
    } catch {
      toast.warning(`OTP: ${generated} (email failed, check console)`);
    }
    setStep(1);
    setLoading(false);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const entered = otp.join('');
    if (entered === sentOtp) {
      toast.success('Email verified!');
      setStep(2);
    } else {
      setError('Incorrect OTP. Please check and retry.');
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (!val && i > 0) otpRefs.current[i - 1]?.focus();
  }

  async function handleResendOtp() {
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(generated);
    try {
      await sendOtpEmail(email, generated);
      toast.success('New OTP sent!');
    } catch {
      toast.warning(`New OTP: ${generated}`);
    }
  }

  function handlePassword(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPass) { setError('Passwords do not match.'); return; }
    setStep(3);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatar(userId: string): Promise<string> {
    if (!avatarFile) return '';
    setUploadingAvatar(true);
    const ext = avatarFile.name.split('.').pop() || 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    setUploadingAvatar(false);
    if (error) { toast.error('Avatar upload failed, continuing without photo.'); return ''; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!dob) { setError('Date of birth is required.'); return; }
    if (pin.length !== 4) { setError('PIN must be 4 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }
    setLoading(true);

    // First create auth account to get userId
    const res = await register({ email, password, fullName, dob, pin });
    if (!res.success) {
      setError(res.error || 'Registration failed.');
      setLoading(false);
      return;
    }

    // Upload avatar if provided
    if (avatarFile) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const url = await uploadAvatar(session.user.id);
        if (url) {
          await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
        }
      }
    }

    toast.success('Account created! Welcome to YourPay 🎉');
    navigate('/dashboard');
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-destructive', 'bg-warning', 'bg-accent'];
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">YourPay</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join millions using YourPay</p>
        </div>

        <StepIndicator step={step} />

        <div className="glass-card rounded-2xl p-6 border border-border/60 animate-scale-in">
          {/* Step 0: Email */}
          {step === 0 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Enter your email</h2>
                <p className="text-muted-foreground text-sm">We'll send a 6-digit OTP to verify it.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-normal">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 bg-secondary/50 border-border" required />
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <Button type="submit" className="w-full glow-btn gap-2" disabled={loading}>
                {loading ? 'Sending OTP…' : <><Mail className="w-4 h-4" /> Send OTP <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          )}

          {/* Step 1: OTP */}
          {step === 1 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Verify your email</h2>
                <p className="text-muted-foreground text-sm">Enter the 6-digit code sent to <span className="text-foreground font-medium">{email}</span></p>
              </div>
              <div className="flex gap-2 justify-center">
                {otp.map((v, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
                    value={v}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) otpRefs.current[i - 1]?.focus(); }}
                    maxLength={1} inputMode="numeric"
                    className="w-11 h-12 rounded-xl border-2 border-border bg-secondary/50 text-center text-lg font-bold mono-number focus:border-primary focus:outline-none transition-colors"
                  />
                ))}
              </div>
              {error && <ErrorBox msg={error} />}
              <Button type="submit" className="w-full glow-btn gap-2">
                Verify OTP <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep(0)} className="text-muted-foreground flex items-center gap-1 hover:text-foreground">
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <button type="button" onClick={handleResendOtp} className="text-primary hover:underline text-xs">
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handlePassword} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Create a password</h2>
                <p className="text-muted-foreground text-sm">Minimum 8 characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-pass" className="text-sm font-normal">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="reg-pass" type={showPass ? 'text' : 'password'} placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 pr-10 bg-secondary/50 border-border" required />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(l => (
                        <div key={l} className={`h-1 flex-1 rounded-full ${passwordStrength >= l ? strengthColors[passwordStrength] : 'bg-border'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-pass" className="text-sm font-normal">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="reg-confirm-pass" type={showPass ? 'text' : 'password'} placeholder="Confirm password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="pl-9 bg-secondary/50 border-border" required />
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <Button type="submit" className="w-full glow-btn gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <form onSubmit={handleProfile} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Set up your profile</h2>
                <p className="text-muted-foreground text-sm">Tell us a bit about yourself.</p>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative w-20 h-20 rounded-full bg-secondary cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Upload profile photo (optional)</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-normal">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="fullName" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-9 bg-secondary/50 border-border" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-sm font-normal">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} className="pl-9 bg-secondary/50 border-border" required max={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="txnPin" className="text-sm font-normal">Transaction PIN *</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="txnPin" type="password" placeholder="4 digits" value={pin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPin(e.target.value); }} className="pl-9 bg-secondary/50 border-border mono-number" maxLength={4} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPin" className="text-sm font-normal">Confirm PIN *</Label>
                  <Input id="confirmPin" type="password" placeholder="Repeat PIN" value={confirmPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setConfirmPin(e.target.value); }} className="bg-secondary/50 border-border mono-number" maxLength={4} required />
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <Button type="submit" className="w-full glow-btn gap-2" disabled={loading || uploadingAvatar}>
                {loading || uploadingAvatar ? 'Creating account…' : <><CheckCircle className="w-4 h-4" /> Create Account</>}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
