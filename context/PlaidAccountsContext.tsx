import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as plaidApi from '../lib/plaidApi';
import type { PlaidAccountRow } from '../lib/plaidApi';
import { PlaidLinkOpener } from '../components/plaid/PlaidLinkOpener';

type PlaidAccountsContextType = {
  accounts: PlaidAccountRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Opens Plaid Link (web or in-app WebView). Requires signed-in user. */
  startLink: () => Promise<void>;
  linkToken: string | null;
  linkStarting: boolean;
  /** Sandbox-only withdraw simulation (requires linked account). */
  withdraw: (accountId: string, amount: string) => Promise<{ reference: string; message?: string }>;
};

const PlaidAccountsContext = createContext<PlaidAccountsContextType | null>(null);

export function PlaidAccountsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [accounts, setAccounts] = useState<PlaidAccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkStarting, setLinkStarting] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await plaidApi.fetchPlaidAccounts(userId);
      setAccounts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startLink = useCallback(async () => {
    if (!userId) return;
    setLinkStarting(true);
    setError(null);
    try {
      const token = await plaidApi.createLinkToken(userId);
      setLinkToken(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start Plaid Link');
    } finally {
      setLinkStarting(false);
    }
  }, [userId]);

  const handlePublicToken = useCallback(
    async (publicToken: string) => {
      if (!userId) return;
      try {
        await plaidApi.exchangePublicToken(userId, publicToken);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Link exchange failed');
      }
    },
    [userId, refresh]
  );

  const closeLink = useCallback(() => setLinkToken(null), []);

  const withdraw = useCallback(
    async (accountId: string, amount: string) => {
      if (!userId) throw new Error('Not signed in');
      return plaidApi.sandboxWithdraw(userId, accountId, amount);
    },
    [userId]
  );

  return (
    <PlaidAccountsContext.Provider
      value={{
        accounts,
        loading,
        error,
        refresh,
        startLink,
        linkToken,
        linkStarting,
        withdraw,
      }}
    >
      {children}
      {userId ? (
        <PlaidLinkOpener
          token={linkToken}
          onPublicToken={handlePublicToken}
          onClosed={closeLink}
        />
      ) : null}
    </PlaidAccountsContext.Provider>
  );
}

export function usePlaidAccounts() {
  const ctx = useContext(PlaidAccountsContext);
  if (!ctx) throw new Error('usePlaidAccounts must be used within PlaidAccountsProvider');
  return ctx;
}
