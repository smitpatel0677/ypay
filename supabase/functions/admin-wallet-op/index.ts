import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Verify admin role
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Admin access required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { action, targetUserId, walletType, amount, reason } = await req.json();
    if (!targetUserId || !walletType || !amount || amount <= 0) return new Response(JSON.stringify({ error: 'Invalid parameters.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', targetUserId).eq('type', walletType).maybeSingle();
    if (!wallet) return new Response(JSON.stringify({ error: 'Wallet not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: targetProfile } = await supabase.from('profiles').select('full_name').eq('id', targetUserId).maybeSingle();

    let newBalance: number;
    let notifType: string;
    let notifTitle: string;

    if (action === 'credit') {
      newBalance = wallet.balance + amount;
      notifType = 'admin_credit';
      notifTitle = 'Admin Credit';
    } else if (action === 'debit') {
      if (wallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      newBalance = wallet.balance - amount;
      notifType = 'admin_debit';
      notifTitle = 'Admin Debit';
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: notifType,
      title: notifTitle,
      message: `Admin ${action === 'credit' ? 'credited' : 'debited'} ₹${amount} ${action === 'credit' ? 'to' : 'from'} your ${walletType} wallet. ${reason || ''}`,
      amount,
    });

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile.full_name || 'Admin',
      action: action === 'credit' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
      details: `${action === 'credit' ? 'Credited' : 'Debited'} ₹${amount} ${action === 'credit' ? 'to' : 'from'} ${targetProfile?.full_name || targetUserId} (${walletType} wallet). Reason: ${reason || 'N/A'}`,
    });

    return new Response(JSON.stringify({ success: true, newBalance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
