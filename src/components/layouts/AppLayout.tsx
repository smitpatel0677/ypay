import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Send, QrCode, CreditCard, PiggyBank,
  History, Bell, User, Settings, LogOut, Menu, X, Shield,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Wallets', path: '/wallets', icon: Wallet },
  { label: 'Send Money', path: '/send', icon: Send },
  { label: 'Receive', path: '/receive', icon: QrCode },
  { label: 'Virtual Card', path: '/card', icon: CreditCard },
  { label: 'Savings', path: '/savings', icon: PiggyBank },
  { label: 'Transactions', path: '/transactions', icon: History },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function NavItems({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { getUnreadCount } = useWallet();
  const unread = user ? getUnreadCount() : 0;

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {NAV.map(({ label, path, icon: Icon }) => {
        const active = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative min-h-[44px] ${active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{label}</span>
            {label === 'Notifications' && unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{unread}</span>
            )}
            {active && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
    onClose?.();
  }

  return (
    <div className="flex flex-col h-full py-4 bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base gradient-text">YourPay</span>
      </div>

      {/* User */}
      {user && (
        <div className="px-4 mb-4">
          <div className="glass-card p-3 rounded-xl flex items-center gap-3">
            <img
              src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              alt={user.fullName}
              className="w-9 h-9 rounded-full shrink-0 bg-secondary"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user.fullName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.upiId}</div>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 flex-1 overflow-y-auto">
        <NavItems onClose={onClose} />
      </div>

      {/* Logout */}
      <div className="px-3 pt-4 border-t border-sidebar-border mt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm gradient-text">YourPay</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
