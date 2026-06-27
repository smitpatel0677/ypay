// YourPay — Types & Utilities (no mock data; all data comes from Supabase)

export interface User {
  id: string;
  email: string;
  fullName: string;
  dob: string;
  profilePic?: string;
  walletNumber: string;
  upiId: string;
  memberSince: string;
  isVerified: boolean;
  isFrozen: boolean;
  pin: string;
  referralCode: string;
}

export interface Wallet {
  id: string;
  userId: string;
  type: 'main' | 'savings' | 'rewards';
  balance: number;
  walletNumber: string;
  upiId: string;
}

export interface Transaction {
  id: string;
  txnId: string;
  referenceId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderUpi: string;
  receiverUpi: string;
  amount: number;
  type: 'debit' | 'credit';
  method: 'upi' | 'wallet' | 'card' | 'qr';
  status: 'pending' | 'awaiting_approval' | 'processing' | 'success' | 'failed' | 'rejected' | 'refunded' | 'cancelled' | 'expired';
  note?: string;
  date: string;
  walletType: 'main' | 'savings' | 'rewards';
  senderPhoto?: string;
  receiverPhoto?: string;
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isFrozen: boolean;
  theme: 'midnight' | 'ocean' | 'sunset';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'money_received' | 'money_sent' | 'card_request' | 'card_approved' | 'card_declined' | 'refund' | 'admin_credit' | 'admin_debit' | 'offer' | 'announcement' | 'security' | 'login';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  amount?: number;
  txnId?: string;
}

export interface PaymentRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUpi: string;
  cardOwnerId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  date: string;
  cardNumber: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  date: string;
}

// ─── Utility Functions ────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function maskCardNumber(cardNumber: string): string {
  const parts = cardNumber.replace(/\s/g, '').match(/.{1,4}/g) || [];
  return parts.map((p, i) => (i === parts.length - 1 ? p : '••••')).join(' ');
}

export const transactionStatusColors: Record<Transaction['status'], string> = {
  pending: 'text-warning bg-warning/10',
  awaiting_approval: 'text-warning bg-warning/10',
  processing: 'text-primary bg-primary/10',
  success: 'text-accent bg-accent/10',
  failed: 'text-destructive bg-destructive/10',
  rejected: 'text-destructive bg-destructive/10',
  refunded: 'text-primary bg-primary/10',
  cancelled: 'text-muted-foreground bg-muted',
  expired: 'text-muted-foreground bg-muted',
};

export const transactionStatusLabels: Record<Transaction['status'], string> = {
  pending: 'Pending',
  awaiting_approval: 'Awaiting Approval',
  processing: 'Processing',
  success: 'Success',
  failed: 'Failed',
  rejected: 'Rejected',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

