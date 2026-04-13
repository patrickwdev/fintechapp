const getBase = () => process.env.EXPO_PUBLIC_PLAID_BACKEND_URL?.replace(/\/$/, '') || '';

export type PlaidAccountRow = {
  id: string;
  name: string;
  mask: string | null;
  subtype: string | null;
  type: string | null;
};

async function fetchPlaid(path: string, init: RequestInit & { userId: string }) {
  const base = getBase();
  if (!base) {
    throw new Error('EXPO_PUBLIC_PLAID_BACKEND_URL is not set. Start the Plaid server and add it to .env.');
  }
  const { userId, ...rest } = init;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      ...rest.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const o =
      typeof data === 'object' && data !== null
        ? (data as {
            error?: string;
            error_code?: string;
            hint?: string;
            display_message?: string;
            request_id?: string;
          })
        : {};
    const parts = [
      o.display_message || o.error || res.statusText,
      o.error_code ? `[${o.error_code}]` : '',
      o.request_id ? `request_id: ${o.request_id}` : '',
      o.hint || '',
    ].filter((s) => typeof s === 'string' && s.trim());
    throw new Error(parts.join('\n\n') || `Request failed (${res.status})`);
  }
  return data;
}

export async function createLinkToken(userId: string): Promise<string> {
  const data = (await fetchPlaid('/api/plaid/create-link-token', {
    method: 'POST',
    userId,
    body: JSON.stringify({}),
  })) as { link_token: string };
  return data.link_token;
}

export async function exchangePublicToken(userId: string, publicToken: string) {
  return fetchPlaid('/api/plaid/exchange-public-token', {
    method: 'POST',
    userId,
    body: JSON.stringify({ public_token: publicToken }),
  }) as Promise<{ item_id: string; accounts: PlaidAccountRow[] }>;
}

export async function fetchPlaidAccounts(userId: string): Promise<PlaidAccountRow[]> {
  const data = (await fetchPlaid('/api/plaid/accounts', {
    method: 'GET',
    userId,
  })) as { accounts: PlaidAccountRow[] };
  return data.accounts ?? [];
}

export async function sandboxWithdraw(
  userId: string,
  accountId: string,
  amount: string
): Promise<{ reference: string; message?: string }> {
  return fetchPlaid('/api/plaid/sandbox-withdraw', {
    method: 'POST',
    userId,
    body: JSON.stringify({ account_id: accountId, amount }),
  }) as Promise<{ reference: string; message?: string }>;
}

/** Plaid processor token for Dwolla (`/processor/token/create` with processor `dwolla`). */
export async function createDwollaProcessorToken(userId: string, accountId: string): Promise<string> {
  const data = (await fetchPlaid('/api/plaid/dwolla-processor-token', {
    method: 'POST',
    userId,
    body: JSON.stringify({ account_id: accountId }),
  })) as { processor_token: string };
  return data.processor_token;
}
