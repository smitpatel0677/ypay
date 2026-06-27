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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { amount, toSavings, pin } = await req.json();
    if (!amount || amount <= 0) return new Response(JSON.stringify({ error: 'Invalid amount.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: pinOk } = await supabase.rpc('verify_pin', { uid: user.id, input_pin: pin });
    if (!pinOk) return new Response(JSON.stringify({ error: 'Incorrect PIN.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const fromType = toSavings ? 'main' : 'savings';
    const toType = toSavings ? 'savings' : 'main';

    const { data: fromWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).eq('type', fromType).maybeSingle();
    const { data: toWallet } = await supabase.from('wallets').select('id').eq('user_id', user.id).eq('type', toType).maybeSingle();

    if (!fromWallet || fromWallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Atomic transfer
    const { error: e1 } = await supabase.from('wallets').update({ balance: fromWallet.balance - amount }).eq('id', fromWallet.id);
    if (e1) throw e1;
    const { data: toW } = await supabase.from('wallets').select('balance').eq('id', toWallet!.id).maybeSingle();
    const { error: e2 } = await supabase.from('wallets').update({ balance: (toW?.balance || 0) + amount }).eq('id', toWallet!.id);
    if (e2) throw e2;

    const { data: profile } = await supabase.from('profiles').select('full_name, upi_id').eq('id', user.id).maybeSingle();

    await supabase.from('transactions').insert({
      sender_id: user.id, receiver_id: user.id,
      sender_name: profile?.full_name || '', receiver_name: 'Self Transfer',
      sender_upi: profile?.upi_id || '', receiver_upi: profile?.upi_id || '',
      amount, type: 'debit', method: 'wallet', status: 'success',
      note: toSavings ? 'Transfer to Savings' : 'Transfer from Savings',
      wallet_type: toType,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
