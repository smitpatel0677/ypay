
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.wallet_type AS ENUM ('main', 'savings', 'rewards');
CREATE TYPE public.txn_status AS ENUM ('pending','awaiting_approval','processing','success','failed','rejected','refunded','cancelled','expired');
CREATE TYPE public.txn_method AS ENUM ('upi','wallet','card','qr');
CREATE TYPE public.txn_type   AS ENUM ('debit','credit');
CREATE TYPE public.card_theme AS ENUM ('midnight','ocean','sunset');
CREATE TYPE public.notif_type AS ENUM ('money_received','money_sent','card_request','card_approved','card_declined','refund','admin_credit','admin_debit','offer','announcement','security','login');
CREATE TYPE public.req_status  AS ENUM ('pending','accepted','rejected','expired');

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  full_name     text NOT NULL DEFAULT '',
  dob           date,
  avatar_url    text,
  wallet_number text UNIQUE,
  upi_id        text UNIQUE,
  pin_hash      text,
  role          public.user_role NOT NULL DEFAULT 'user',
  is_frozen     boolean NOT NULL DEFAULT false,
  referral_code text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- auto-generate wallet_number and upi_id on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname text;
  wnum  text;
BEGIN
  uname := regexp_replace(lower(split_part(NEW.email,'@',1)), '[^a-z0-9]', '', 'g');
  wnum  := 'YP' || lpad(floor(random()*100000000)::text, 8, '0');
  INSERT INTO public.profiles(id, email, full_name, wallet_number, upi_id, referral_code)
  VALUES (
    NEW.id, NEW.email, '',
    wnum,
    uname || '@ypay',
    upper(substr(uname,1,6)) || '20'
  );
  -- create 3 wallets
  INSERT INTO public.wallets(user_id, type, balance, wallet_number, upi_id)
  VALUES
    (NEW.id, 'main',    0, wnum, uname||'@ypay'),
    (NEW.id, 'savings', 0, wnum||'-S', uname||'.savings@ypay'),
    (NEW.id, 'rewards', 0, wnum||'-R', uname||'.rewards@ypay');
  -- create virtual card
  INSERT INTO public.virtual_cards(user_id, card_number, cvv, expiry_month, expiry_year, holder_name)
  VALUES (
    NEW.id,
    lpad(floor(random()*9999)::text,4,'0')||' '||lpad(floor(random()*9999)::text,4,'0')||' '||lpad(floor(random()*9999)::text,4,'0')||' '||lpad(floor(random()*9999)::text,4,'0'),
    lpad(floor(100+random()*900)::text,3,'0'),
    lpad(floor(1+random()*12)::text,2,'0'),
    to_char(now() + interval '3 years','YY'),
    ''
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── wallets ───────────────────────────────────────────────────────────────────
CREATE TABLE public.wallets (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          public.wallet_type NOT NULL,
  balance       numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  wallet_number text UNIQUE NOT NULL,
  upi_id        text UNIQUE NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- ── virtual_cards ─────────────────────────────────────────────────────────────
CREATE TABLE public.virtual_cards (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_number  text NOT NULL,
  cvv          text NOT NULL,
  expiry_month text NOT NULL,
  expiry_year  text NOT NULL,
  holder_name  text NOT NULL DEFAULT '',
  is_frozen    boolean NOT NULL DEFAULT false,
  theme        public.card_theme NOT NULL DEFAULT 'midnight',
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- ── transactions ──────────────────────────────────────────────────────────────
CREATE TABLE public.transactions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_id       text UNIQUE NOT NULL DEFAULT 'TXN'||floor(extract(epoch from now())*1000)::text||floor(random()*1000)::text,
  reference_id text UNIQUE NOT NULL DEFAULT 'REF'||floor(extract(epoch from now())*1000)::text||floor(random()*10000)::text,
  sender_id    uuid REFERENCES public.profiles(id),
  receiver_id  uuid REFERENCES public.profiles(id),
  sender_name  text NOT NULL DEFAULT '',
  receiver_name text NOT NULL DEFAULT '',
  sender_upi   text NOT NULL DEFAULT '',
  receiver_upi text NOT NULL DEFAULT '',
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  type         public.txn_type NOT NULL,
  method       public.txn_method NOT NULL DEFAULT 'upi',
  status       public.txn_status NOT NULL DEFAULT 'pending',
  note         text,
  wallet_type  public.wallet_type NOT NULL DEFAULT 'main',
  sender_photo  text,
  receiver_photo text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_txn_sender   ON public.transactions(sender_id);
CREATE INDEX idx_txn_receiver ON public.transactions(receiver_id);
CREATE INDEX idx_txn_created  ON public.transactions(created_at DESC);

-- ── payment_requests ──────────────────────────────────────────────────────────
CREATE TABLE public.payment_requests (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name  text NOT NULL DEFAULT '',
  requester_upi   text NOT NULL DEFAULT '',
  card_owner_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  status          public.req_status NOT NULL DEFAULT 'pending',
  card_number     text NOT NULL DEFAULT '',
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       public.notif_type NOT NULL DEFAULT 'announcement',
  title      text NOT NULL,
  message    text NOT NULL,
  amount     numeric(12,2),
  txn_id     text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);

-- ── savings_goals ─────────────────────────────────────────────────────────────
CREATE TABLE public.savings_goals (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  target       numeric(12,2) NOT NULL CHECK (target > 0),
  saved        numeric(12,2) NOT NULL DEFAULT 0 CHECK (saved >= 0),
  deadline     date,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES public.profiles(id),
  user_name  text NOT NULL DEFAULT '',
  action     text NOT NULL,
  details    text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- ── offers ────────────────────────────────────────────────────────────────────
CREATE TABLE public.offers (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  description text NOT NULL,
  discount    numeric(5,2) NOT NULL DEFAULT 0,
  valid_until date,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- ── login_history ─────────────────────────────────────────────────────────────
CREATE TABLE public.login_history (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_login_user ON public.login_history(user_id, created_at DESC);

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ── Security helper ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;
