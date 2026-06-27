import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Shield, Zap, CreditCard, QrCode, PiggyBank, Globe, ChevronDown,
  CheckCircle, ArrowRight, Smartphone, Lock,
  Send, Bell, Users, BarChart3, MessageCircle, Twitter, Instagram, Linkedin,
  Wallet, Eye, EyeOff
} from 'lucide-react';

const FEATURES = [
  { icon: CreditCard, title: 'Virtual Cards', desc: 'Instantly generated YourPay virtual cards with unique numbers, valid exclusively within the YourPay ecosystem.' },
  { icon: QrCode, title: 'QR Payments', desc: 'Generate static or dynamic QR codes. Pay or receive in seconds by scanning any YourPay QR.' },
  { icon: PiggyBank, title: 'Savings Wallet', desc: 'Dedicated savings wallet with goals, analytics, and one-tap transfers from your main balance.' },
  { icon: Globe, title: 'UPI Transfers', desc: 'Auto-generated username@ypay UPI IDs. Send money instantly to any YourPay user.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'AES-256 encryption, CSRF protection, 4-digit PIN, rate limiting, and full audit logs on every action.' },
  { icon: Zap, title: 'Instant Settlements', desc: 'Real-time balance updates, 2-second polling, and atomic transactions — money is never lost.' },
];

const FAQS = [
  { q: 'Is YourPay free to use?', a: 'Yes! Creating a YourPay account and sending/receiving money is completely free. Premium features may have nominal charges.' },
  { q: 'How secure is my money?', a: 'YourPay uses bank-grade AES-256 encryption, prepared SQL statements, CSRF protection, transaction PIN verification, and full audit logging.' },
  { q: 'Can I use the virtual card outside YourPay?', a: 'YourPay Virtual Cards are exclusively valid within the YourPay ecosystem and cannot be used on external payment gateways.' },
  { q: 'How fast are transfers?', a: 'Transfers between YourPay users are instant. Wallet balances update in real-time with our 2-second polling system.' },
  { q: 'What is the Rewards Wallet?', a: 'You earn digital money in your Rewards Wallet through referrals (₹20/referral), cashback, and special offers. Rewards can be used for payments.' },
  { q: 'How do I get my UPI ID?', a: 'Your UPI ID (username@ypay) is automatically generated when you register. You can share it instantly for payments.' },
];



// Animated Phone Mockup
function PhoneMockup() {
  const [balance, setBalance] = useState(12450.75);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(b => +(b + Math.random() * 10 - 5).toFixed(2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-75 animate-glow-pulse" />
      {/* Phone shell */}
      <div className="relative w-64 md:w-72 bg-[hsl(228_20%_6%)] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-float">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] text-muted-foreground">
          <span>5:13 PM</span>
          <div className="flex gap-1">
            <div className="w-4 h-2 border border-muted-foreground rounded-sm"><div className="w-3/4 h-full bg-accent rounded-sm" /></div>
          </div>
        </div>
        {/* App content */}
        <div className="px-4 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white">A</div>
            <span className="font-bold text-sm text-foreground">YourPay</span>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
          {/* Balance card */}
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-[10px] text-muted-foreground">Account Balance</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-foreground">
                ₹{show ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '••••••'}
              </span>
              <button onClick={() => setShow(s => !s)} className="text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-[9px] text-primary mt-1 font-mono">arjunsharma@ypay</div>
          </div>
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2">
            {[{ icon: Send, label: 'Send' }, { icon: QrCode, label: 'QR' }, { icon: CreditCard, label: 'Card' }, { icon: PiggyBank, label: 'Save' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          {/* Recent txn */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-2">Recent</div>
            {[
              { name: 'Priya Patel', amount: '+₹1,200', color: 'text-accent' },
              { name: 'Rahul Verma', amount: '-₹500', color: 'text-destructive' },
            ].map(t => (
              <div key={t.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{t.name[0]}</div>
                  <span className="text-[10px] text-foreground">{t.name}</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold ${t.color}`}>{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Home indicator */}
        <div className="pb-2 flex justify-center">
          <div className="w-20 h-1 bg-muted-foreground/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl gradient-text">YourPay</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="glow-btn">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* BG blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center w-full">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs text-muted-foreground border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Built by SRP Digital Studios
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">
              The Future of{' '}
              <span className="gradient-text">Digital Payments</span>{' '}
              is Here
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl text-pretty leading-relaxed max-w-lg">
              Send money, scan QR codes, use virtual cards, and grow your savings — all in one premium fintech platform built for speed and security.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="glow-btn gap-2 text-base px-8">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="ghost" className="border border-white/20 text-foreground hover:bg-white/5 gap-2 text-base px-8">
                  Learn More <ChevronDown className="w-4 h-4" />
                </Button>
              </a>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              {['Bank-Grade Security', 'Instant Transfers', 'Zero Hidden Fees'].map(b => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-accent" /> {b}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">Everything you need,<br /><span className="gradient-text">nothing you don't</span></h2>
            <p className="text-muted-foreground text-lg mt-4 text-pretty max-w-2xl mx-auto">A complete digital payment ecosystem built with security, speed, and simplicity at its core.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300 group hover:shadow-hover h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm text-pretty leading-relaxed flex-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Virtual Card Preview ─────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center order-2 md:order-1">
            {/* Card mockup */}
            <div className="relative w-72 md:w-80">
              <div className="payment-card p-6 aspect-[1.586/1] flex flex-col justify-between hover:scale-105 transition-transform duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white/80 text-sm font-semibold">YourPay</span>
                  </div>
                  <div className="w-10 h-6 rounded bg-yellow-400/80 flex items-center justify-center">
                    <div className="w-7 h-4 border-2 border-yellow-600/50 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="bg-yellow-600/60 rounded-sm" />
                      <div className="bg-yellow-600/60 rounded-sm" />
                      <div className="bg-yellow-600/60 rounded-sm" />
                      <div className="bg-yellow-600/60 rounded-sm" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-[10px] mb-1 font-mono tracking-widest">CARD NUMBER</div>
                  <div className="text-white font-mono text-sm md:text-base tracking-widest">•••• •••• •••• 7890</div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-white/50 text-[9px] mb-0.5">CARD HOLDER</div>
                    <div className="text-white text-xs font-semibold">ARJUN SHARMA</div>
                  </div>
                  <div>
                    <div className="text-white/50 text-[9px] mb-0.5">EXPIRES</div>
                    <div className="text-white text-xs font-mono">09/28</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-xs font-bold">YourPay</div>
                    <div className="text-white/50 text-[9px]">Ecosystem Only</div>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs text-primary border border-primary/20">
              <CreditCard className="w-3.5 h-3.5" /> Virtual Card
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Your own <span className="gradient-text">virtual card</span>, instantly</h2>
            <p className="text-muted-foreground text-pretty leading-relaxed">Every YourPay account includes a unique virtual card with auto-generated number, CVV, and expiry. Freeze it, replace it, or hide details — all with one tap.</p>
            <ul className="space-y-3">
              {['Unique card number & CVV per user', 'PIN-protected CVV reveal', 'Instant freeze & unfreeze', 'Valid exclusively within YourPay', 'Replace card anytime'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Security ─────────────────────────────────────────────── */}
      <section id="security" className="py-24 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Security you can <span className="gradient-text">trust</span></h2>
          <p className="text-muted-foreground text-lg mb-16 text-pretty max-w-2xl mx-auto">Every action on YourPay is protected by multiple layers of enterprise-grade security.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'AES-256 Encryption', desc: 'All sensitive data encrypted at rest and in transit' },
              { icon: Shield, title: 'CSRF Protection', desc: 'Every form is protected against cross-site request forgery' },
              { icon: BarChart3, title: 'Full Audit Logs', desc: 'Every sensitive action is logged with timestamps and IP' },
              { icon: Zap, title: 'Rate Limiting', desc: 'Brute force protection with intelligent rate limiting' },
            ].map(s => (
              <div key={s.title} className="glass-card p-6 rounded-2xl text-center h-full flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm text-pretty">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Frequently asked <span className="gradient-text">questions</span></h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden border border-border/50">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-sm md:text-base">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground text-pretty leading-relaxed border-t border-border/50 pt-4 animate-slide-up">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Download CTA ─────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Smartphone className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Ready to experience <span className="gradient-text">YourPay</span>?</h2>
          <p className="text-muted-foreground text-lg mb-8 text-pretty max-w-xl mx-auto">Start sending and receiving money instantly with your YourPay account.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="glow-btn gap-2 text-base px-10 w-full sm:w-auto">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="border border-white/20 text-foreground hover:bg-white/5 text-base px-10 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold gradient-text">YourPay</span>
              </div>
              <p className="text-muted-foreground text-sm text-pretty">A premium digital payment platform by SRP Digital Studios.</p>
              <div className="flex gap-3 mt-4">
                {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Virtual Cards', 'QR Payments', 'Savings'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <div className="font-semibold text-sm mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>© 2026 YourPay. All rights reserved.</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Built by SRP Digital Studios</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="w-3 h-3" /> Support: support@yourpay.com
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
