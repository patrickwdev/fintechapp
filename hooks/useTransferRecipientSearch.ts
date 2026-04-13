import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type TransferRecipientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email_local: string | null;
};

const DEBOUNCE_MS = 350;

export function useTransferRecipientSearch(searchQuery: string) {
  const { session, isHydrated } = useAuth();
  const [results, setResults] = useState<TransferRecipientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!isHydrated || !session?.user?.id || q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('search_profiles_for_transfer', {
        p_search: q,
        p_limit: 25,
      });

      if (cancelled) return;
      setLoading(false);

      if (rpcError) {
        setError(rpcError.message);
        setResults([]);
        return;
      }

      setResults((data as TransferRecipientRow[] | null) ?? []);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, session?.user?.id, isHydrated]);

  return { results, loading, error, canSearch: !!session?.user?.id };
}
