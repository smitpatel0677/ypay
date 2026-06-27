
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username) WHERE username IS NOT NULL;

-- Auto-set username from email prefix on insert if not set
CREATE OR REPLACE FUNCTION public.set_default_username()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.username IS NULL THEN
    NEW.username := split_part(NEW.email, '@', 1);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_default_username ON public.profiles;
CREATE TRIGGER tr_set_default_username
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_default_username();

-- SECURITY DEFINER function: look up email by username (for admin login)
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE username = p_username LIMIT 1;
  RETURN v_email;
END;
$$;

-- Update existing admin user: set username='admin11' and email
UPDATE public.profiles SET username = 'admin11', role = 'admin', full_name = 'Admin'
WHERE email = 'admin@ypay.com' OR role = 'admin';
