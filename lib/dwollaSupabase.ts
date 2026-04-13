import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

async function messageFromInvokeError(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError && err.context && typeof err.context.json === 'function') {
    try {
      const body = (await err.context.json()) as Record<string, unknown>;
      const parts = [body.error, body.message, body.hint, body.details]
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => String(x).slice(0, 400));
      if (parts.length) return parts.join(' — ');
    } catch {
      /* ignore */
    }
  }
  return err instanceof Error ? err.message : String(err);
}

export type DwollaStatusResponse = {
  ok: true;
  action: 'status';
  environment: 'sandbox';
  supabaseUserId: string;
  dwollaTokenExpiresIn: number;
  dwollaRootOk: true;
  dwollaAccountName: string | null;
};

export type DwollaCreateCustomerResponse = {
  ok: true;
  action: 'create_customer';
  alreadyExists: boolean;
  dwollaCustomerUrl: string;
  supabaseUserId: string;
};

export type DwollaAttachFundingSourceResponse = {
  ok: true;
  action: 'attach_plaid_funding_source';
  alreadyExists: boolean;
  fundingSourceUrl: string;
  supabaseUserId: string;
};

export type DwollaAddMoneyResponse = {
  ok: true;
  action: 'add_money';
  transferUrl: string;
  amount: string;
  amountCents: number;
  supabaseUserId: string;
  walletCredited?: boolean;
  creditError?: string;
  message?: string;
};

export type DwollaErrorResponse = {
  error: string;
  hint?: string;
  message?: string;
  status?: number;
  details?: string;
};

/** User JWT only — never the anon key (otherwise the edge function returns 401). */
async function resolveUserAccessToken(override?: string | null): Promise<string | null> {
  const trimmed = typeof override === 'string' ? override.trim() : '';
  if (trimmed) return trimmed;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token?.trim() || null;
}

function invokeHeaders(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}

/**
 * Health check: Dwolla sandbox token + API root. Requires signed-in user.
 */
export async function checkDwollaSandboxConnection(accessTokenOverride?: string | null): Promise<{
  data: DwollaStatusResponse | null;
  error: Error | null;
}> {
  const accessToken = await resolveUserAccessToken(accessTokenOverride);
  if (!accessToken) {
    return { data: null, error: new Error('Not signed in; cannot check Dwolla') };
  }

  const { data, error } = await supabase.functions.invoke<DwollaStatusResponse | DwollaErrorResponse>(
    'dwolla-sandbox',
    { method: 'POST', body: { action: 'status' }, headers: invokeHeaders(accessToken) }
  );

  if (error) return { data: null, error: new Error(await messageFromInvokeError(error)) };
  if (data && 'error' in data && data.error) return { data: null, error: new Error(data.error) };
  if (data && 'ok' in data && data.ok && data.action === 'status') {
    return { data: data as DwollaStatusResponse, error: null };
  }
  return { data: null, error: new Error('Unexpected response from dwolla-sandbox') };
}

/**
 * Creates a Dwolla sandbox receive-only customer for the signed-in user and
 * stores `dwolla_customer_url` on `public.profiles` (server-side, service role).
 *
 * @param accessTokenOverride — Pass `signUp` / `signIn` response `session.access_token` to avoid a
 * race where `getSession()` has not persisted yet (anon key would be sent → edge 401).
 */
export async function createDwollaCustomer(accessTokenOverride?: string | null): Promise<{
  data: DwollaCreateCustomerResponse | null;
  error: Error | null;
}> {
  const accessToken = await resolveUserAccessToken(accessTokenOverride);
  if (!accessToken) {
    return { data: null, error: new Error('Not signed in; cannot create Dwolla customer') };
  }

  const { data, error } = await supabase.functions.invoke<
    DwollaCreateCustomerResponse | DwollaErrorResponse
  >('dwolla-sandbox', {
    method: 'POST',
    body: { action: 'create_customer' },
    headers: invokeHeaders(accessToken),
  });

  if (error) return { data: null, error: new Error(await messageFromInvokeError(error)) };
  if (data && 'error' in data && data.error) return { data: null, error: new Error(data.error) };
  if (data && 'ok' in data && data.ok && data.action === 'create_customer') {
    return { data: data as DwollaCreateCustomerResponse, error: null };
  }
  return { data: null, error: new Error('Unexpected response from dwolla-sandbox') };
}

/**
 * Attach Plaid-linked bank to Dwolla customer via processor token (idempotent if already attached).
 */
export async function attachPlaidFundingSourceDwolla(
  plaidProcessorToken: string,
  accessTokenOverride?: string | null
): Promise<{ data: DwollaAttachFundingSourceResponse | null; error: Error | null }> {
  const accessToken = await resolveUserAccessToken(accessTokenOverride);
  if (!accessToken) {
    return { data: null, error: new Error('Not signed in; cannot attach funding source') };
  }

  const { data, error } = await supabase.functions.invoke<
    DwollaAttachFundingSourceResponse | DwollaErrorResponse
  >('dwolla-sandbox', {
    method: 'POST',
    body: { action: 'attach_plaid_funding_source', plaid_processor_token: plaidProcessorToken },
    headers: invokeHeaders(accessToken),
  });

  if (error) return { data: null, error: new Error(await messageFromInvokeError(error)) };
  if (data && 'error' in data && data.error) return { data: null, error: new Error(data.error) };
  if (data && 'ok' in data && data.ok && data.action === 'attach_plaid_funding_source') {
    return { data: data as DwollaAttachFundingSourceResponse, error: null };
  }
  return { data: null, error: new Error('Unexpected response from dwolla-sandbox') };
}

/**
 * Create Dwolla transfer from user's Plaid-linked bank funding source → app master balance (sandbox).
 * Wallet credit runs when `dwolla-webhook` processes transfer_completed.
 */
export async function addMoneyFromBankDwolla(
  amount: string,
  accessTokenOverride?: string | null
): Promise<{ data: DwollaAddMoneyResponse | null; error: Error | null }> {
  const accessToken = await resolveUserAccessToken(accessTokenOverride);
  if (!accessToken) {
    return { data: null, error: new Error('Not signed in; cannot add money') };
  }

  const { data, error } = await supabase.functions.invoke<DwollaAddMoneyResponse | DwollaErrorResponse>(
    'dwolla-sandbox',
    {
      method: 'POST',
      body: { action: 'add_money', amount: amount.trim() },
      headers: invokeHeaders(accessToken),
    }
  );

  if (error) return { data: null, error: new Error(await messageFromInvokeError(error)) };
  if (data && 'error' in data && data.error) return { data: null, error: new Error(data.error) };
  if (data && 'ok' in data && data.ok && data.action === 'add_money') {
    return { data: data as DwollaAddMoneyResponse, error: null };
  }
  return { data: null, error: new Error('Unexpected response from dwolla-sandbox') };
}

/**
 * Raw `fetch` example (web or RN). Same security rules as `invoke`:
 * - Use the **anon** key in `apikey` (public, expected in the client).
 * - Never put the **service_role** key in the app.
 * - Always send the user's **access_token** in `Authorization: Bearer ...`
 *   (required when the function has verify_jwt / your handler checks getUser()).
 *
 * const session = (await supabase.auth.getSession()).data.session;
 * if (!session) return;
 * await fetch(`${SUPABASE_URL}/functions/v1/dwolla-sandbox`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     apikey: SUPABASE_ANON_KEY,
 *     Authorization: `Bearer ${session.access_token}`,
 *   },
 *   body: JSON.stringify({ action: 'create_customer' }),
 * });
 */
