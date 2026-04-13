import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatMoneyFromCents, formatUSPhoneDigits, emailLocalPart } from '../lib/formatters';
import type { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type AccountSummary = {
  displayName: string;
  handle: string;
  email: string;
  phoneDisplay: string | null;
  ssnMasked: string | null;
  balanceCents: number;
  balanceFormatted: string;
  profileCompletionPercent: number;
  profile: ProfileRow | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

function metaString(user: { user_metadata?: Record<string, unknown> } | undefined, key: string): string {
  if (!user) return '';
  const v = user.user_metadata?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function useAccountSummary(): AccountSummary {
  const { session, isHydrated } = useAuth();
  const user = session?.user;
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [balanceCents, setBalanceCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setBalanceCents(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [profileRes, walletRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
    ]);
    if (!profileRes.error && profileRes.data) {
      setProfile(profileRes.data as ProfileRow);
    } else {
      setProfile(null);
    }
    if (!walletRes.error && walletRes.data) {
      setBalanceCents(walletRes.data.balance ?? 0);
    } else {
      setBalanceCents(0);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isHydrated) return;
    load();
  }, [isHydrated, load]);

  const email = user?.email?.trim() ?? '';
  const fn = profile?.first_name?.trim() || metaString(user, 'first_name') || '';
  const ln = profile?.last_name?.trim() || metaString(user, 'last_name') || '';
  const displayName =
    [fn, ln].filter(Boolean).join(' ') ||
    (email ? emailLocalPart(email).replace(/[._-]/g, ' ') : 'Member');
  const handle = `@${emailLocalPart(email)}`;
  const phoneDigits =
    profile?.phone?.replace(/\D/g, '') || metaString(user, 'phone').replace(/\D/g, '') || '';
  const phoneDisplay = phoneDigits.length === 10 ? formatUSPhoneDigits(phoneDigits) : null;
  const last4 = profile?.ssn_last_four?.trim() || metaString(user, 'ssn_last_four').trim() || '';
  const ssnMasked = last4.length === 4 ? `•••-••-${last4}` : null;

  const hasLegalName = Boolean(fn && ln);
  const completionParts = [hasLegalName, Boolean(email), phoneDigits.length === 10, last4.length === 4];
  const profileCompletionPercent = Math.round(
    (completionParts.filter(Boolean).length / completionParts.length) * 100
  );

  return {
    displayName,
    handle,
    email,
    phoneDisplay,
    ssnMasked,
    balanceCents,
    balanceFormatted: formatMoneyFromCents(balanceCents),
    profileCompletionPercent,
    profile,
    loading,
    refresh: load,
  };
}
