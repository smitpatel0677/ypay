import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, formatDate, formatTime, transactionStatusColors, transactionStatusLabels, type Transaction } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, ArrowDownLeft, ArrowUpRight, Download,
  Share2, Filter, History, SlidersHorizontal
} from 'lucide-react';

export default function TransactionHistoryPage() {
  const { user } = useAuth();
  const { transactions } = useWallet();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  if (!user) return null;
  const all = transactions;

  const filtered = all.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.senderName.toLowerCase().includes(q) || t.receiverName.toLowerCase().includes(q)
      || t.txnId.toLowerCase().includes(q) || t.referenceId.toLowerCase().includes(q)
      || (t.note || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchMethod = methodFilter === 'all' || t.method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  function downloadReceipt(txn: Transaction) {
    const text = [
      '=== YourPay Transaction Receipt ===',
      `Transaction ID : ${txn.txnId}`,
      `Reference ID   : ${txn.referenceId}`,
      `Date & Time    : ${formatDate(txn.date)} ${formatTime(txn.date)}`,
      `From           : ${txn.senderName} (${txn.senderUpi})`,
      `To             : ${txn.receiverName} (${txn.receiverUpi})`,
      `Amount         : ${formatCurrency(txn.amount)}`,
      `Method         : ${txn.method.toUpperCase()}`,
      `Status         : ${transactionStatusLabels[txn.status]}`,
      txn.note ? `Note           : ${txn.note}` : '',
      '================================',
    ].filter(Boolean).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `receipt-${txn.txnId}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded!');
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground text-sm">{all.length} total transactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, ID, note…" value={search}
              onChange={e => { setSearch(e.target.value); toast.info('', { duration: 0 }); }}
              className="pl-9 bg-secondary/50 border-border" />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
            <SelectTrigger className="w-36 bg-secondary/50 border-border text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={v => { setMethodFilter(v); }}>
            <SelectTrigger className="w-28 bg-secondary/50 border-border text-sm">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="qr">QR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction detail overlay */}
        {selectedTxn && (
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Transaction Details</h2>
              <button onClick={() => setSelectedTxn(null)} className="text-muted-foreground text-sm hover:text-foreground">Close</button>
            </div>
            {[
              { label: 'Transaction ID', value: selectedTxn.txnId },
              { label: 'Reference ID', value: selectedTxn.referenceId },
              { label: 'Date', value: `${formatDate(selectedTxn.date)} at ${formatTime(selectedTxn.date)}` },
              { label: 'From', value: `${selectedTxn.senderName} (${selectedTxn.senderUpi})` },
              { label: 'To', value: `${selectedTxn.receiverName} (${selectedTxn.receiverUpi})` },
              { label: 'Amount', value: formatCurrency(selectedTxn.amount) },
              { label: 'Method', value: selectedTxn.method.toUpperCase() },
              { label: 'Status', value: transactionStatusLabels[selectedTxn.status] },
              ...(selectedTxn.note ? [{ label: 'Note', value: selectedTxn.note }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm gap-3">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="font-medium mono-number text-right break-all">{value}</span>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-border" onClick={() => downloadReceipt(selectedTxn)}>
                <Download className="w-3.5 h-3.5" /> Receipt
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-border" onClick={() => { navigator.clipboard.writeText(selectedTxn.txnId); toast.success('TXN ID copied!'); }}>
                <Share2 className="w-3.5 h-3.5" /> Copy ID
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(txn => {
                const isCredit = txn.receiverId === user.id;
                const counterparty = isCredit ? txn.senderName : txn.receiverName;
                const photo = isCredit ? txn.senderPhoto : txn.receiverPhoto;
                return (
                  <button key={txn.id} onClick={() => setSelectedTxn(txn)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left">
                    <div className="relative shrink-0">
                      <img src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${counterparty}`} alt={counterparty}
                        className="w-10 h-10 rounded-full bg-secondary" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isCredit ? 'bg-accent' : 'bg-destructive'}`}>
                        {isCredit ? <ArrowDownLeft className="w-2.5 h-2.5 text-white" /> : <ArrowUpRight className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{counterparty}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(txn.date)} · {txn.method.toUpperCase()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-semibold mono-number text-sm ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                      </div>
                      <div className={`text-[10px] ${transactionStatusColors[txn.status]}`}>
                        {transactionStatusLabels[txn.status]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
