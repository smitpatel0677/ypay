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
    const { data: { user } } = await createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { action, cardNumber, expiryMonth, expiryYear, holderName, amount, requestId, pin } = await req.json();

    if (action === 'request') {
      // Find card owner
      const { data: card } = await supabase.from('virtual_cards')
        .select('user_id, is_frozen').eq('card_number', cardNumber)
        .eq('expiry_month', expiryMonth).eq('expiry_year', expiryYear)
        .maybeSingle();

      if (!card) return new Response(JSON.stringify({ error: 'Card not found or invalid details.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (card.is_frozen) return new Response(JSON.stringify({ error: 'Card is frozen.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (card.user_id === user.id) return new Response(JSON.stringify({ error: 'Cannot pay yourself.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: requester } = await supabase.from('profiles').select('full_name, upi_id').eq('id', user.id).maybeSingle();
      const { data: pr, error: prErr } = await supabase.from('payment_requests').insert({
        requester_id: user.id,
        requester_name: requester?.full_name || '',
        requester_upi: requester?.upi_id || '',
        card_owner_id: card.user_id,
        amount,
        card_number: cardNumber,
      }).select('id').maybeSingle();

      if (prErr) throw prErr;

      await supabase.from('notifications').insert({
        user_id: card.user_id,
        type: 'card_request',
        title: 'Card Payment Request',
        message: `${requester?.full_name || 'Someone'} wants to charge ₹${amount} using your YourPay Card`,
        amount,
      });

      return new Response(JSON.stringify({ success: true, requestId: pr?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'accept') {
      const { data: pinOk } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
      if (!pinOk) return new Response(JSON.stringify({ error: 'Incorrect PIN.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: pr } = await supabase.from('payment_requests').select('*').eq('id', requestId).eq('card_owner_id', user.id).eq('status', 'pending').maybeSingle();
      if (!pr) return new Response(JSON.stringify({ error: 'Request not found or already processed.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (new Date(pr.expires_at) < new Date()) {
        await supabase.from('payment_requests').update({ status: 'expired' }).eq('id', requestId);
        return new Response(JSON.stringify({ error: 'Request has expired.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: ownerWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).eq('type', 'main').maybeSingle();
      if (!ownerWallet || ownerWallet.balance < pr.amount) return new Response(JSON.stringify({ error: 'Insufficient balance.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: requesterWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', pr.requester_id).eq('type', 'main').maybeSingle();
      if (!requesterWallet) return new Response(JSON.stringify({ error: 'Requester wallet not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      await supabase.from('wallets').update({ balance: ownerWallet.balance - pr.amount }).eq('id', ownerWallet.id);
      await supabase.from('wallets').update({ balance: requesterWallet.balance + pr.amount }).eq('id', requesterWallet.id);
      await supabase.from('payment_requests').update({ status: 'accepted' }).eq('id', requestId);

      const { data: ownerProfile } = await supabase.from('profiles').select('full_name, upi_id').eq('id', user.id).maybeSingle();
      const txnBase = {
        sender_id: user.id, receiver_id: pr.requester_id,
        sender_name: ownerProfile?.full_name || '', receiver_name: pr.requester_name,
        sender_upi: ownerProfile?.upi_id || '', receiver_upi: pr.requester_upi,
        amount: pr.amount, method: 'card' as const, status: 'success' as const,
        wallet_type: 'main' as const,
      };
      const { data: txn } = await supabase.from('transactions').insert({ ...txnBase, type: 'debit' }).select('txn_id').maybeSingle();
      await supabase.from('transactions').insert({ ...txnBase, type: 'credit' });

      await supabase.from('notifications').insert([
        { user_id: user.id, type: 'card_approved', title: 'Card Payment Approved', message: `You approved ₹${pr.amount} card payment to ${pr.requester_name}`, amount: pr.amount },
        { user_id: pr.requester_id, type: 'card_approved', title: 'Payment Approved!', message: `Your ₹${pr.amount} card payment was approved`, amount: pr.amount, txn_id: txn?.txn_id },
      ]);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reject') {
      const { data: pr } = await supabase.from('payment_requests').select('requester_id, amount').eq('id', requestId).eq('card_owner_id', user.id).maybeSingle();
      if (!pr) return new Response(JSON.stringify({ error: 'Request not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
      await supabase.from('notifications').insert({ user_id: pr.requester_id, type: 'card_declined', title: 'Payment Declined', message: `Your ₹${pr.amount} card payment was declined`, amount: pr.amount });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
