
-- Admin credit wallet RPC
CREATE OR REPLACE FUNCTION admin_credit_wallet(
  p_user_id uuid,
  p_wallet_type text,
  p_amount numeric,
  p_note text DEFAULT 'Admin credit'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND type = p_wallet_type::wallet_type;

  INSERT INTO transactions (
    txn_id, sender_id, sender_name, sender_upi,
    receiver_id, receiver_name, receiver_upi,
    amount, method, status, note, wallet_type, type
  )
  SELECT
    'ADM-CREDIT-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    p_user_id, 'Admin', 'admin@ypay',
    p_user_id, p.full_name, p.upi_id,
    p_amount, 'admin', 'success', p_note, p_wallet_type::wallet_type, 'credit'
  FROM profiles p WHERE p.id = p_user_id;
END;
$$;

-- Admin debit wallet RPC
CREATE OR REPLACE FUNCTION admin_debit_wallet(
  p_user_id uuid,
  p_wallet_type text,
  p_amount numeric,
  p_note text DEFAULT 'Admin debit'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND type = p_wallet_type::wallet_type;

  INSERT INTO transactions (
    txn_id, sender_id, sender_name, sender_upi,
    receiver_id, receiver_name, receiver_upi,
    amount, method, status, note, wallet_type, type
  )
  SELECT
    'ADM-DEBIT-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    p_user_id, p.full_name, p.upi_id,
    p_user_id, 'Admin', 'admin@ypay',
    p_amount, 'admin', 'success', p_note, p_wallet_type::wallet_type, 'debit'
  FROM profiles p WHERE p.id = p_user_id;
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION admin_credit_wallet TO service_role;
GRANT EXECUTE ON FUNCTION admin_debit_wallet TO service_role;
