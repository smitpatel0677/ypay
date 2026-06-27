import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { receiverUpi, amount, method, note, pin } = await req.json();

    if (!receiverUpi || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify PIN
    const { data: sender } = await supabase.from('profiles').select('id, full_name, upi_id, pin_hash, avatar_url').eq('id', user.id).maybeSingle();
    if (!sender) return new Response(JSON.stringify({ error: 'Sender not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Simple PIN check (hash stored as plain bcrypt - compare using pg crypt or just store hashed)
    // For now verify via RPC
    const { data: pinOk } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
    if (!pinOk) return new Response(JSON.stringify({ error: 'Incorrect PIN.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Find receiver
    const { data: receiver } = await supabase.from('profiles').select('id, full_name, upi_id, avatar_url').eq('upi_id', receiverUpi).maybeSingle();
    if (!receiver) return new Response(JSON.stringify({ error: 'Receiver not found with this UPI ID.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (sender.id === receiver.id) return new Response(JSON.stringify({ error: 'Cannot send money to yourself.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check sender balance
    const { data: senderWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', sender.id).eq('type', 'main').maybeSingle();
    if (!senderWallet || senderWallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: receiverWallet } = await supabase.from('wallets').select('id').eq('user_id', receiver.id).eq('type', 'main').maybeSingle();
    if (!receiverWallet) return new Response(JSON.stringify({ error: 'Receiver wallet not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Atomic debit/credit via RPC
    const { data: txnResult, error: txnErr } = await supabase.rpc('execute_send_money', {
      p_sender_id: sender.id,
      p_receiver_id: receiver.id,
      p_sender_wallet_id: senderWallet.id,
      p_receiver_wallet_id: receiverWallet.id,
      p_amount: amount,
      p_method: method || 'upi',
      p_note: note || '',
      p_sender_name: sender.full_name,
      p_receiver_name: receiver.full_name,
      p_sender_upi: sender.upi_id,
      p_receiver_upi: receiver.upi_id,
      p_sender_photo: sender.avatar_url || '',
      p_receiver_photo: receiver.avatar_url || '',
    });

    if (txnErr) return new Response(JSON.stringify({ error: txnErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Insert notifications
    await supabase.from('notifications').insert([
      { user_id: sender.id, type: 'money_sent', title: 'Payment Sent', message: `You sent ₹${amount} to ${receiver.full_name}`, amount, txn_id: txnResult },
      { user_id: receiver.id, type: 'money_received', title: 'Money Received!', message: `${sender.full_name} sent you ₹${amount}`, amount, txn_id: txnResult },
    ]);

    // Audit log
    await supabase.from('audit_logs').insert({ user_id: sender.id, user_name: sender.full_name, action: 'MONEY_TRANSFER', details: `Sent ₹${amount} to ${receiverUpi}` });

    return new Response(JSON.stringify({ success: true, txnId: txnResult }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
