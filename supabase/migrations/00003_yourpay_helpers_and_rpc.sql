
-- verify_pin RPC (stores PIN as plain text for now, bcrypt can be added later)
CREATE OR REPLACE FUNCTION public.verify_pin(uid uuid, input_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND pin_hash = input_pin);
END;
$$;

-- execute_send_money: atomic debit+credit, returns txn_id
CREATE OR REPLACE FUNCTION public.execute_send_money(
  p_sender_id uuid, p_receiver_id uuid,
  p_sender_wallet_id uuid, p_receiver_wallet_id uuid,
  p_amount numeric,
  p_method text, p_note text,
  p_sender_name text, p_receiver_name text,
  p_sender_upi text, p_receiver_upi text,
  p_sender_photo text, p_receiver_photo text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_txn_id text;
  v_ref_id text;
BEGIN
  -- Lock wallets in consistent order to avoid deadlock
  PERFORM id FROM public.wallets WHERE id IN (p_sender_wallet_id, p_receiver_wallet_id) ORDER BY id FOR UPDATE;

  -- Check balance
  IF (SELECT balance FROM public.wallets WHERE id = p_sender_wallet_id) < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance.';
  END IF;

  -- Debit sender
  UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_sender_wallet_id;
  -- Credit receiver
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_receiver_wallet_id;

  v_txn_id := 'TXN' || floor(extract(epoch from now())*1000)::text || floor(random()*1000)::text;
  v_ref_id := 'REF' || floor(extract(epoch from now())*1000)::text || floor(random()*10000)::text;

  INSERT INTO public.transactions(txn_id, reference_id, sender_id, receiver_id, sender_name, receiver_name, sender_upi, receiver_upi, amount, type, method, status, note, wallet_type, sender_photo, receiver_photo)
  VALUES
    (v_txn_id, v_ref_id, p_sender_id, p_receiver_id, p_sender_name, p_receiver_name, p_sender_upi, p_receiver_upi, p_amount, 'debit',  p_method::public.txn_method, 'success', p_note, 'main', p_sender_photo, p_receiver_photo),
    ('TXN'||floor(extract(epoch from now())*1000+1)::text||floor(random()*1000)::text, 'REF'||floor(extract(epoch from now())*1000+1)::text||floor(random()*10000)::text, p_sender_id, p_receiver_id, p_sender_name, p_receiver_name, p_sender_upi, p_receiver_upi, p_amount, 'credit', p_method::public.txn_method, 'success', p_note, 'main', p_sender_photo, p_receiver_photo);

  RETURN v_txn_id;
END;
$$;

-- admin_stats view
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT count(*) FROM public.profiles WHERE role = 'user') AS total_users,
  (SELECT count(*) FROM public.transactions) AS total_transactions,
  (SELECT coalesce(sum(balance),0) FROM public.wallets) AS total_wallet_balance,
  (SELECT count(*) FROM public.transactions WHERE created_at::date = current_date) AS todays_transactions,
  (SELECT count(*) FROM public.virtual_cards WHERE is_frozen = false) AS active_cards,
  (SELECT count(*) FROM public.payment_requests WHERE status = 'pending') AS pending_requests,
  (SELECT count(*) FROM public.profiles WHERE is_frozen = true) AS frozen_users;
