/**
 * Dwolla sandbox proxy: no Dwolla app token is returned to clients.
 * Actions (JSON body): "status" (default) | "create_customer" | "attach_plaid_funding_source" | "add_money"
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

const DWOLLA_TOKEN_URL = 'https://api-sandbox.dwolla.com/token';
const DWOLLA_API_ROOT = 'https://api-sandbox.dwolla.com/';
const DWOLLA_CUSTOMERS = 'https://api-sandbox.dwolla.com/customers';
const DWOLLA_ACCEPT = 'application/vnd.dwolla.v1.hal+json';

type Body = {
  action?: string;
  plaid_processor_token?: string;
  amount?: string;
};

const DWOLLA_TRANSFERS = 'https://api-sandbox.dwolla.com/transfers';

function normalizeDwollaResourceUrl(href: string): string {
  const t = href.trim();
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.origin}${path}`;
  } catch {
    return t.replace(/\/+$/, '');
  }
}

function dollarsToCents(value: string): number | null {
  const s = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function userFromJwtClaims(claims: Record<string, unknown>): AuthUser | null {
  const sub = claims.sub;
  if (typeof sub !== 'string' || !sub) return null;
  const email = typeof claims.email === 'string' ? claims.email : null;
  const um = claims.user_metadata;
  const user_metadata =
    typeof um === 'object' && um !== null && !Array.isArray(um)
      ? (um as Record<string, unknown>)
      : undefined;
  return { id: sub, email, user_metadata };
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

async function getDwollaAppToken(key: string, secret: string): Promise<{ access_token: string; expires_in: number }> {
  const basic = btoa(`${key}:${secret}`);
  const res = await fetch(DWOLLA_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Dwolla token ${res.status}: ${text}`);
  }
  const json = JSON.parse(text) as { access_token: string; expires_in: number };
  if (!json.access_token) throw new Error('Dwolla token response missing access_token');
  return json;
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  return '127.0.0.1';
}

async function handleStatus(
  access_token: string,
  expires_in: number,
  userId: string,
  hdr: HeadersInit
): Promise<Response> {
  const rootRes = await fetch(DWOLLA_API_ROOT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: DWOLLA_ACCEPT,
    },
  });

  const rootText = await rootRes.text();
  if (!rootRes.ok) {
    return new Response(
      JSON.stringify({
        error: 'Dwolla API root request failed',
        status: rootRes.status,
        details: rootText.slice(0, 500),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  let accountName: string | undefined;
  try {
    const hal = JSON.parse(rootText) as { name?: string };
    accountName = hal.name;
  } catch {
    /* ignore */
  }

  return new Response(
    JSON.stringify({
      ok: true,
      action: 'status',
      environment: 'sandbox',
      supabaseUserId: userId,
      dwollaTokenExpiresIn: expires_in,
      dwollaRootOk: true,
      dwollaAccountName: accountName ?? null,
    }),
    { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
  );
}

async function handleCreateCustomer(
  req: Request,
  user: AuthUser,
  access_token: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  hdr: HeadersInit
): Promise<Response> {
  const email = user.email?.trim();
  if (!email) {
    return new Response(JSON.stringify({ error: 'User has no email' }), {
      status: 400,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name, dwolla_customer_url')
    .eq('id', user.id)
    .maybeSingle();

  const existing = profile?.dwolla_customer_url?.trim();
  if (existing) {
    return new Response(
      JSON.stringify({
        ok: true,
        action: 'create_customer',
        alreadyExists: true,
        dwollaCustomerUrl: existing,
        supabaseUserId: user.id,
      }),
      { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const meta = user.user_metadata;
  const metaFirst = typeof meta?.first_name === 'string' ? meta.first_name.trim() : '';
  const metaLast = typeof meta?.last_name === 'string' ? meta.last_name.trim() : '';
  const firstName = profile?.first_name?.trim() || metaFirst || 'Customer';
  const lastName = profile?.last_name?.trim() || metaLast || 'User';

  const ip = clientIp(req);
  const idempotencyKey = user.id;

  const dwRes = await fetch(DWOLLA_CUSTOMERS, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: DWOLLA_ACCEPT,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      type: 'personal',
      ipAddress: ip,
      address1: '123 Main Street',
      city: 'Des Moines',
      state: 'IA',
      postalCode: '50309',
    }),
  });

  const dwText = await dwRes.text();
  if (!dwRes.ok) {
    const { data: profileAfterFail } = await admin
      .from('profiles')
      .select('dwolla_customer_url')
      .eq('id', user.id)
      .maybeSingle();
    const urlAfterRace = profileAfterFail?.dwolla_customer_url?.trim();
    if (urlAfterRace) {
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'create_customer',
          alreadyExists: true,
          dwollaCustomerUrl: urlAfterRace,
          supabaseUserId: user.id,
        }),
        { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'Dwolla customer creation failed',
        status: dwRes.status,
        details: dwText.slice(0, 800),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const location = dwRes.headers.get('Location')?.trim();
  if (!location) {
    const { data: profileNoLoc } = await admin
      .from('profiles')
      .select('dwolla_customer_url')
      .eq('id', user.id)
      .maybeSingle();
    const urlRace = profileNoLoc?.dwolla_customer_url?.trim();
    if (urlRace) {
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'create_customer',
          alreadyExists: true,
          dwollaCustomerUrl: urlRace,
          supabaseUserId: user.id,
        }),
        { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'Dwolla did not return Location header for new customer',
        bodyPreview: dwText.slice(0, 400),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const { error: upErr } = await admin
    .from('profiles')
    .update({ dwolla_customer_url: location, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (upErr) {
    return new Response(
      JSON.stringify({
        error: 'Dwolla customer created but failed to save URL to profile',
        message: upErr.message,
        dwollaCustomerUrl: location,
      }),
      { status: 500, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      action: 'create_customer',
      alreadyExists: false,
      dwollaCustomerUrl: location,
      supabaseUserId: user.id,
    }),
    { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
  );
}

async function handleAttachPlaidFundingSource(
  user: AuthUser,
  access_token: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  plaidToken: string,
  hdr: HeadersInit
): Promise<Response> {
  const token = plaidToken.trim();
  if (!token) {
    return new Response(JSON.stringify({ error: 'plaid_processor_token required' }), {
      status: 400,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('dwolla_customer_url, dwolla_bank_funding_source_url')
    .eq('id', user.id)
    .maybeSingle();

  const customerUrl = profile?.dwolla_customer_url?.trim();
  if (!customerUrl) {
    return new Response(
      JSON.stringify({
        error: 'No Dwolla customer',
        hint: 'Open the app while signed in so create_customer runs, or invoke action create_customer first.',
      }),
      { status: 400, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const existingFs = profile?.dwolla_bank_funding_source_url?.trim();
  if (existingFs) {
    return new Response(
      JSON.stringify({
        ok: true,
        action: 'attach_plaid_funding_source',
        alreadyExists: true,
        fundingSourceUrl: existingFs,
        supabaseUserId: user.id,
      }),
      { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const fsUrl = `${customerUrl.replace(/\/+$/, '')}/funding-sources`;
  const idem = `plaid-fs-${user.id}`;
  const dwRes = await fetch(fsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: DWOLLA_ACCEPT,
      'Content-Type': 'application/json',
      'Idempotency-Key': idem,
    },
    body: JSON.stringify({ plaidToken: token }),
  });

  const dwText = await dwRes.text();
  if (!dwRes.ok) {
    const receiveOnlyHint = /receive[-\s]?only/i.test(dwText)
      ? 'Receive-only customers cannot use a bank as a send/source funding source for ACH debits. Use a verified Personal (or Business) customer in Dwolla sandbox, or recreate the customer via this app’s create_customer action (it uses type personal).'
      : undefined;
    return new Response(
      JSON.stringify({
        error: 'Dwolla funding source creation failed',
        status: dwRes.status,
        details: dwText.slice(0, 800),
        ...(receiveOnlyHint ? { hint: receiveOnlyHint } : {}),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const location = dwRes.headers.get('Location')?.trim();
  if (!location) {
    return new Response(
      JSON.stringify({
        error: 'Dwolla did not return Location for funding source',
        bodyPreview: dwText.slice(0, 400),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const normalized = normalizeDwollaResourceUrl(location);
  const { error: upErr } = await admin
    .from('profiles')
    .update({ dwolla_bank_funding_source_url: normalized, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (upErr) {
    return new Response(
      JSON.stringify({
        error: 'Funding source created in Dwolla but failed to save URL on profile',
        message: upErr.message,
        fundingSourceUrl: normalized,
      }),
      { status: 500, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      action: 'attach_plaid_funding_source',
      alreadyExists: false,
      fundingSourceUrl: normalized,
      supabaseUserId: user.id,
    }),
    { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
  );
}

async function handleAddMoneyTransfer(
  user: AuthUser,
  access_token: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  amountInput: string,
  hdr: HeadersInit
): Promise<Response> {
  const destMaster = (Deno.env.get('DWOLLA_APP_MASTER_FUNDING_SOURCE_URL') ?? '').trim();
  if (!destMaster) {
    return new Response(
      JSON.stringify({
        error: 'DWOLLA_APP_MASTER_FUNDING_SOURCE_URL is not configured',
        hint:
          'In Dwolla sandbox, copy your Master Account balance funding-source URL and set it as a Supabase secret.',
      }),
      { status: 503, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const cents = dollarsToCents(amountInput);
  if (cents === null) {
    return new Response(
      JSON.stringify({ error: 'Invalid amount; use dollars with up to two decimals (e.g. "10" or "10.50").' }),
      { status: 400, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('dwolla_bank_funding_source_url')
    .eq('id', user.id)
    .maybeSingle();

  const sourceUrl = profile?.dwolla_bank_funding_source_url?.trim();
  if (!sourceUrl) {
    return new Response(
      JSON.stringify({
        error: 'No Dwolla bank funding source',
        hint: 'Link Plaid, then call attach_plaid_funding_source with a Dwolla processor token.',
      }),
      { status: 400, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const value = (cents / 100).toFixed(2);
  const idem = crypto.randomUUID();
  const dwRes = await fetch(DWOLLA_TRANSFERS, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: DWOLLA_ACCEPT,
      'Content-Type': 'application/json',
      'Idempotency-Key': idem,
    },
    body: JSON.stringify({
      _links: {
        source: { href: sourceUrl },
        destination: { href: destMaster },
      },
      amount: {
        currency: 'USD',
        value,
      },
    }),
  });

  const dwText = await dwRes.text();
  if (!dwRes.ok) {
    const receiveOnlyHint = /receive[-\s]?only/i.test(dwText)
      ? 'Transfers that pull from the user’s bank require a customer type that may send ACH—not Receive-only. Use a Personal customer created via create_customer in this app, or adjust the customer in Dwolla sandbox.'
      : undefined;
    return new Response(
      JSON.stringify({
        error: 'Dwolla transfer creation failed',
        status: dwRes.status,
        details: dwText.slice(0, 800),
        ...(receiveOnlyHint ? { hint: receiveOnlyHint } : {}),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const location = dwRes.headers.get('Location')?.trim();
  if (!location) {
    return new Response(
      JSON.stringify({
        error: 'Dwolla did not return Location for transfer',
        bodyPreview: dwText.slice(0, 400),
      }),
      { status: 502, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const normalizedTransferUrl = normalizeDwollaResourceUrl(location);
  const { error: pendErr } = await admin.from('dwolla_pending_transfers').insert({
    transfer_resource_url: normalizedTransferUrl,
    user_id: user.id,
    amount_cents: cents,
  });

  if (pendErr) {
    return new Response(
      JSON.stringify({
        error: 'Transfer created in Dwolla but failed to record pending row',
        message: pendErr.message,
        transferUrl: normalizedTransferUrl,
      }),
      { status: 500, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const { data: walletCredited, error: creditErr } = await admin.rpc('try_credit_wallet_from_dwolla', {
    p_transfer_url: normalizedTransferUrl,
    p_user_id: user.id,
    p_amount_cents: cents,
  });

  if (creditErr) {
    return new Response(
      JSON.stringify({
        ok: true,
        action: 'add_money',
        transferUrl: normalizedTransferUrl,
        amount: value,
        amountCents: cents,
        supabaseUserId: user.id,
        walletCredited: false,
        creditError: creditErr.message,
        message:
          'Dwolla transfer was created and recorded, but the wallet RPC failed. Apply migration 20250404150000_dwolla_add_money.sql (function try_credit_wallet_from_dwolla) or configure dwolla-webhook to credit on transfer_completed.',
      }),
      { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const credited = walletCredited === true;
  return new Response(
    JSON.stringify({
      ok: true,
      action: 'add_money',
      transferUrl: normalizedTransferUrl,
      amount: value,
      amountCents: cents,
      supabaseUserId: user.id,
      walletCredited: credited,
      message: credited
        ? 'Wallet credited. Pull to refresh if the home screen still shows the old balance.'
        : 'Transfer recorded; wallet was already credited for this transfer URL (idempotent).',
    }),
    { status: 200, headers: { ...hdr, 'Content-Type': 'application/json' } }
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const hdr = { ...corsHeaders(origin) };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: hdr });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  const jwt = authHeader.slice(7).trim();
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Missing JWT' }), {
      status: 401,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const dwollaKey = Deno.env.get('DWOLLA_KEY') ?? '';
  const dwollaSecret = Deno.env.get('DWOLLA_SECRET') ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Supabase URL or anon key missing in function environment' }), {
      status: 503,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }

  if (!dwollaKey || !dwollaSecret) {
    return new Response(
      JSON.stringify({
        error: 'Dwolla is not configured',
        hint: 'Set secrets: supabase secrets set DWOLLA_KEY=... DWOLLA_SECRET=...',
      }),
      { status: 503, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(jwt);
  let user: AuthUser | null =
    !claimsError && claimsData?.claims
      ? userFromJwtClaims(claimsData.claims as Record<string, unknown>)
      : null;

  if (!user) {
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: udata, error: userError } = await supabaseUserClient.auth.getUser();
    const u = udata?.user;
    if (!userError && u?.id) {
      user = {
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata as Record<string, unknown> | undefined,
      };
    }
  }

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Invalid or expired session',
        hint: claimsError?.message ?? 'JWT could not be verified (check project JWT / signing keys)',
      }),
      { status: 401, headers: { ...hdr, 'Content-Type': 'application/json' } }
    );
  }

  let action = 'status';
  let postBody: Body = {};
  if (req.method === 'POST') {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try {
        postBody = (await req.json()) as Body;
        if (postBody?.action === 'create_customer') action = 'create_customer';
        else if (postBody?.action === 'attach_plaid_funding_source') action = 'attach_plaid_funding_source';
        else if (postBody?.action === 'add_money') action = 'add_money';
      } catch {
        /* empty or invalid body → default status */
      }
    }
  }

  try {
    const { access_token, expires_in } = await getDwollaAppToken(dwollaKey, dwollaSecret);

    if (action === 'create_customer') {
      if (!serviceRoleKey) {
        return new Response(
          JSON.stringify({
            error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function environment',
            hint: 'It is usually injected automatically when the function runs on Supabase.',
          }),
          { status: 503, headers: { ...hdr, 'Content-Type': 'application/json' } }
        );
      }
      return await handleCreateCustomer(req, user, access_token, supabaseUrl, serviceRoleKey, hdr);
    }

    if (action === 'attach_plaid_funding_source') {
      if (!serviceRoleKey) {
        return new Response(
          JSON.stringify({
            error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function environment',
            hint: 'It is usually injected automatically when the function runs on Supabase.',
          }),
          { status: 503, headers: { ...hdr, 'Content-Type': 'application/json' } }
        );
      }
      return await handleAttachPlaidFundingSource(
        user,
        access_token,
        supabaseUrl,
        serviceRoleKey,
        typeof postBody.plaid_processor_token === 'string' ? postBody.plaid_processor_token : '',
        hdr
      );
    }

    if (action === 'add_money') {
      if (!serviceRoleKey) {
        return new Response(
          JSON.stringify({
            error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function environment',
            hint: 'It is usually injected automatically when the function runs on Supabase.',
          }),
          { status: 503, headers: { ...hdr, 'Content-Type': 'application/json' } }
        );
      }
      return await handleAddMoneyTransfer(
        user,
        access_token,
        supabaseUrl,
        serviceRoleKey,
        typeof postBody.amount === 'string' ? postBody.amount : '',
        hdr
      );
    }

    return await handleStatus(access_token, expires_in, user.id, hdr);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: 'Dwolla request failed', message }), {
      status: 502,
      headers: { ...hdr, 'Content-Type': 'application/json' },
    });
  }
});
