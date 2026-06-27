
-- ── profiles RLS ──────────────────────────────────────────────────────────────
CREATE POLICY "admin_full_profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM public.get_user_role(auth.uid()));

-- ── wallets RLS ───────────────────────────────────────────────────────────────
CREATE POLICY "admin_full_wallets" ON public.wallets
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_wallets" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── virtual_cards RLS ─────────────────────────────────────────────────────────
CREATE POLICY "admin_full_cards" ON public.virtual_cards
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_card" ON public.virtual_cards
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_update_own_card" ON public.virtual_cards
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ── transactions RLS ──────────────────────────────────────────────────────────
CREATE POLICY "admin_full_transactions" ON public.transactions
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_txns" ON public.transactions
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ── payment_requests RLS ──────────────────────────────────────────────────────
CREATE POLICY "admin_full_requests" ON public.payment_requests
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_requests" ON public.payment_requests
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR card_owner_id = auth.uid());

CREATE POLICY "user_insert_request" ON public.payment_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "user_update_own_request" ON public.payment_requests
  FOR UPDATE TO authenticated USING (card_owner_id = auth.uid());

-- ── notifications RLS ─────────────────────────────────────────────────────────
CREATE POLICY "admin_full_notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_notifs" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_update_own_notifs" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_delete_own_notifs" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── savings_goals RLS ─────────────────────────────────────────────────────────
CREATE POLICY "admin_full_goals" ON public.savings_goals
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_all_own_goals" ON public.savings_goals
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── audit_logs RLS ────────────────────────────────────────────────────────────
CREATE POLICY "admin_view_audit" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ── offers RLS ────────────────────────────────────────────────────────────────
CREATE POLICY "admin_full_offers" ON public.offers
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_active_offers" ON public.offers
  FOR SELECT TO authenticated USING (is_active = true);

-- ── login_history RLS ─────────────────────────────────────────────────────────
CREATE POLICY "admin_view_login_history" ON public.login_history
  FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "user_view_own_login_history" ON public.login_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── Storage: avatars bucket ───────────────────────────────────────────────────
CREATE POLICY "avatar_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatar_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatar_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
