import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/db/supabase';
import type { Wallet, Transaction, Notification, VirtualCard, PaymentRequest } from '@/lib/mockData';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  notifications: Notification[];
  paymentRequests: PaymentRequest[];
  card: VirtualCard | null;
  loadingWallets: boolean;
  getWallet: (type: Wallet['type']) => Wallet | undefined;
  getBalance: (type: Wallet['type']) => number;
  sendMoney: (params: SendParams) => Promise<{ success: boolean; txnId?: string; error?: string }>;
  transferToSavings: (amount: number, toSavings: boolean, pin: string) => Promise<{ success: boolean; error?: string }>;
  refreshWallets: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getTodaySpending: () => number;
  getMonthlySpending: () => number;
  getUnreadCount: () => number;
  markAllRead: () => Promise<void>;
  markRead: (notifId: string) => Promise<void>;
  deleteNotif: (notifId: string) => Promise<void>;
  freezeCard: (pin: string) => Promise<{ success: boolean; error?: string }>;
  unfreezeCard: (pin: string) => Promise<{ success: boolean; error?: string }>;
  replaceCard: (pin: string) => Promise<{ success: boolean; error?: string }>;
  getPendingRequests: () => PaymentRequest[];
  acceptPaymentRequest: (reqId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  rejectPaymentRequest: (reqId: string) => Promise<void>;
}

interface SendParams {
  receiverUpi: string;
  receiverName: string;
  amount: number;
  method: Transaction['method'];
  note?: string;
  pin: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

function dbToWallet(w: Record<string, unknown>): Wallet {
  return {
    id: w.id as string,
    userId: w.user_id as string,
    type: w.type as Wallet['type'],
    balance: Number(w.balance),
    walletNumber: w.wallet_number as string,
    upiId: w.upi_id as string,
  };
}

function dbToTxn(t: Record<string, unknown>): Transaction {
  return {
    id: t.id as string,
    txnId: t.txn_id as string,
    referenceId: t.reference_id as string,
    senderId: (t.sender_id as string) || '',
    receiverId: (t.receiver_id as string) || '',
    senderName: (t.sender_name as string) || '',
    receiverName: (t.receiver_name as string) || '',
    senderUpi: (t.sender_upi as string) || '',
    receiverUpi: (t.receiver_upi as string) || '',
    amount: Number(t.amount),
    type: t.type as Transaction['type'],
    method: t.method as Transaction['method'],
    status: t.status as Transaction['status'],
    note: t.note as string | undefined,
    date: t.created_at as string,
    walletType: (t.wallet_type as Wallet['type']) || 'main',
    senderPhoto: t.sender_photo as string | undefined,
    receiverPhoto: t.receiver_photo as string | undefined,
  };
}

function dbToNotif(n: Record<string, unknown>): Notification {
  return {
    id: n.id as string,
    userId: n.user_id as string,
    type: n.type as Notification['type'],
    title: n.title as string,
    message: n.message as string,
    date: n.created_at as string,
    isRead: n.is_read as boolean,
    amount: n.amount ? Number(n.amount) : undefined,
    txnId: n.txn_id as string | undefined,
  };
}

function dbToCard(c: Record<string, unknown>): VirtualCard {
  return {
    id: c.id as string,
    userId: c.user_id as string,
    cardNumber: c.card_number as string,
    cvv: c.cvv as string,
    expiryMonth: c.expiry_month as string,
    expiryYear: c.expiry_year as string,
    holderName: c.holder_name as string,
    isFrozen: c.is_frozen as boolean,
    theme: (c.theme as VirtualCard['theme']) || 'midnight',
  };
}

function dbToRequest(r: Record<string, unknown>): PaymentRequest {
  return {
    id: r.id as string,
    requesterId: r.requester_id as string,
    requesterName: r.requester_name as string,
    requesterUpi: r.requester_upi as string,
    cardOwnerId: r.card_owner_id as string,
    amount: Number(r.amount),
    status: r.status as PaymentRequest['status'],
    date: r.created_at as string,
    cardNumber: r.card_number as string,
  };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [card, setCard] = useState<VirtualCard | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refreshWallets = useCallback(async () => {
    if (!user) return;
    setLoadingWallets(true);
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).order('type');
    if (data) setWallets(data.map(w => dbToWallet(w as Record<string, unknown>)));
    setLoadingWallets(false);
  }, [user]);

  const refreshTransactions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('transactions').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false }).limit(100);
    if (data) setTransactions(data.map(t => dbToTxn(t as Record<string, unknown>)));
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data.map(n => dbToNotif(n as Record<string, unknown>)));
  }, [user]);

  const refreshCard = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('virtual_cards').select('*').eq('user_id', user.id).maybeSingle();
    if (data) setCard(dbToCard(data as Record<string, unknown>));
  }, [user]);

  const refreshRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('payment_requests').select('*')
      .eq('card_owner_id', user.id).eq('status', 'pending').order('created_at', { ascending: false });
    if (data) setPaymentRequests(data.map(r => dbToRequest(r as Record<string, unknown>)));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setWallets([]); setTransactions([]); setNotifications([]);
      setPaymentRequests([]); setCard(null);
      return;
    }
    refreshWallets(); refreshTransactions(); refreshNotifications(); refreshCard(); refreshRequests();

    // Realtime: wallet balances + notifications
    channelRef.current = supabase.channel(`user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => refreshWallets())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refreshNotifications())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_requests', filter: `card_owner_id=eq.${user.id}` }, () => refreshRequests())
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [user, refreshWallets, refreshTransactions, refreshNotifications, refreshCard, refreshRequests]);

  const getWallet = useCallback((type: Wallet['type']) => wallets.find(w => w.type === type), [wallets]);
  const getBalance = useCallback((type: Wallet['type']) => wallets.find(w => w.type === type)?.balance ?? 0, [wallets]);

  const sendMoney = useCallback(async (params: SendParams) => {
    const { data, error } = await supabase.functions.invoke('send-money', { body: params });
    if (error) {
      const msg = await error?.context?.text().catch(() => error.message);
      return { success: false, error: msg || 'Transfer failed.' };
    }
    if (!data?.success) return { success: false, error: data?.error || 'Transfer failed.' };
    await refreshWallets(); await refreshTransactions(); await refreshNotifications();
    return { success: true, txnId: data.txnId };
  }, [refreshWallets, refreshTransactions, refreshNotifications]);

  const transferToSavings = useCallback(async (amount: number, toSavings: boolean, pin: string) => {
    const { data, error } = await supabase.functions.invoke('wallet-transfer', { body: { amount, toSavings, pin } });
    if (error) {
      const msg = await error?.context?.text().catch(() => error.message);
      return { success: false, error: msg || 'Transfer failed.' };
    }
    if (!data?.success) return { success: false, error: data?.error || 'Transfer failed.' };
    await refreshWallets(); await refreshTransactions();
    return { success: true };
  }, [refreshWallets, refreshTransactions]);

  const getTodaySpending = useCallback(() => {
    if (!user) return 0;
    const today = new Date().toDateString();
    return transactions
      .filter(t => t.senderId === user.id && t.type === 'debit' && t.status === 'success' && new Date(t.date).toDateString() === today)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, user]);

  const getMonthlySpending = useCallback(() => {
    if (!user) return 0;
    const now = new Date();
    return transactions
      .filter(t => { const d = new Date(t.date); return t.senderId === user.id && t.type === 'debit' && t.status === 'success' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, user]);

  const getUnreadCount = useCallback(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, [user]);

  const markRead = useCallback(async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  }, []);

  const deleteNotif = useCallback(async (notifId: string) => {
    await supabase.from('notifications').delete().eq('id', notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }, []);

  const freezeCard = useCallback(async (pin: string) => {
    if (!user || !card) return { success: false, error: 'No card found.' };
    const { data: ok } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
    if (!ok) return { success: false, error: 'Incorrect PIN.' };
    await supabase.from('virtual_cards').update({ is_frozen: true }).eq('id', card.id);
    setCard(prev => prev ? { ...prev, isFrozen: true } : prev);
    await supabase.from('audit_logs').insert({ user_id: user.id, user_name: user.fullName, action: 'CARD_FREEZE', details: 'Virtual card frozen' });
    return { success: true };
  }, [user, card]);

  const unfreezeCard = useCallback(async (pin: string) => {
    if (!user || !card) return { success: false, error: 'No card found.' };
    const { data: ok } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
    if (!ok) return { success: false, error: 'Incorrect PIN.' };
    await supabase.from('virtual_cards').update({ is_frozen: false }).eq('id', card.id);
    setCard(prev => prev ? { ...prev, isFrozen: false } : prev);
    return { success: true };
  }, [user, card]);

  const replaceCard = useCallback(async (pin: string) => {
    if (!user || !card) return { success: false, error: 'No card found.' };
    const { data: ok } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
    if (!ok) return { success: false, error: 'Incorrect PIN.' };
    const num = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
    const cvv = String(Math.floor(100 + Math.random() * 900));
    const yr = String(new Date().getFullYear() + 3).slice(-2);
    const mo = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    await supabase.from('virtual_cards').update({ card_number: num, cvv, expiry_month: mo, expiry_year: yr, is_frozen: false }).eq('id', card.id);
    await refreshCard();
    await supabase.from('audit_logs').insert({ user_id: user.id, user_name: user.fullName, action: 'CARD_REPLACE', details: 'Virtual card replaced' });
    return { success: true };
  }, [user, card, refreshCard]);

  const getPendingRequests = useCallback(() => paymentRequests, [paymentRequests]);

  const acceptPaymentRequest = useCallback(async (reqId: string, pin: string) => {
    const { data, error } = await supabase.functions.invoke('card-payment', { body: { action: 'accept', requestId: reqId, pin } });
    if (error) {
      const msg = await error?.context?.text().catch(() => error.message);
      return { success: false, error: msg || 'Failed.' };
    }
    if (!data?.success) return { success: false, error: data?.error || 'Failed.' };
    await refreshWallets(); await refreshRequests(); await refreshNotifications(); await refreshTransactions();
    return { success: true };
  }, [refreshWallets, refreshRequests, refreshNotifications, refreshTransactions]);

  const rejectPaymentRequest = useCallback(async (reqId: string) => {
    await supabase.functions.invoke('card-payment', { body: { action: 'reject', requestId: reqId } });
    await refreshRequests(); await refreshNotifications();
  }, [refreshRequests, refreshNotifications]);

  return (
    <WalletContext.Provider value={{
      wallets, transactions, notifications, paymentRequests, card, loadingWallets,
      getWallet, getBalance, sendMoney, transferToSavings,
      refreshWallets, refreshTransactions, refreshNotifications,
      getTodaySpending, getMonthlySpending,
      getUnreadCount, markAllRead, markRead, deleteNotif,
      freezeCard, unfreezeCard, replaceCard,
      getPendingRequests, acceptPaymentRequest, rejectPaymentRequest,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
