import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  ProcessorTokenCreateRequestProcessorEnum as Processor,
} from 'plaid';
import { upgradeDwollaCustomerToUnverified } from './dwollaUpgradeCustomerToUnverified.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Root .env (Expo) then server/.env — server wins so you can override per service.
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env'), override: true });

const PORT = Number(process.env.PORT) || 3001;
const clientId = process.env.PLAID_CLIENT_ID;
const secret = process.env.PLAID_SECRET;
const envName = (process.env.PLAID_ENV || 'sandbox').toLowerCase();

if (!process.env.DWOLLA_ACCESS_TOKEN?.trim()) {
  console.warn(
    '[plaid-server] Missing DWOLLA_ACCESS_TOKEN. Set a sandbox app token (or client-credentials token) to call /api/dwolla/upgrade-customer-to-unverified.'
  );
}

if (!clientId || !secret) {
  console.warn(
    '[plaid-server] Missing PLAID_CLIENT_ID or PLAID_SECRET. Set them in server/.env or the repo root .env (Sandbox keys from Dashboard → Team Settings → Keys).'
  );
} else {
  const tail = clientId.length > 8 ? `…${clientId.slice(-6)}` : '(short id)';
  console.log(
    `[plaid-server] Plaid environment: ${envName} | client_id ends with ${tail} — must match the same Keys page where Dwolla integration is enabled.`
  );
}

const plaidEnv =
  envName === 'development'
    ? PlaidEnvironments.development
    : envName === 'production'
      ? PlaidEnvironments.production
      : PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath: plaidEnv,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': clientId || '',
      'PLAID-SECRET': secret || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/** @type {Map<string, { access_token: string, item_id: string, accounts: import('plaid').AccountBase[] }>} */
const userItems = new Map();

/** Auth must be on the Item for `/processor/token/create` with processor `dwolla`. */
function itemHasAuthProduct(item) {
  if (!item) return false;
  const combined = [
    ...(item.products ?? []),
    ...(item.billed_products ?? []),
    ...(item.available_products ?? []),
  ];
  return combined.some((p) => p === Products.Auth || p === 'auth');
}

function formatPlaidAxiosError(e) {
  const d = e?.response?.data;
  if (d && typeof d === 'object') {
    const error_message = d.error_message ?? d.message ?? e.message;
    const error_code = d.error_code ?? null;
    const error_type = d.error_type ?? null;
    const display_message = d.display_message ?? null;
    const request_id = d.request_id ?? null;
    let hint = null;
    const msgLc = String(error_message).toLowerCase();
    const isDwollaIntegrationError =
      error_code === 'INVALID_PRODUCT' && (msgLc.includes('dwolla') || msgLc.includes('twolla'));

    if (isDwollaIntegrationError) {
      hint = [
        'Plaid is rejecting processor tokens: this exact client_id + secret are not Dwolla-enabled.',
        `1) Dashboard → Team Settings → Keys: copy Sandbox client_id and Sandbox secret (not Development/Production unless PLAID_ENV matches).`,
        `2) Put them in server/.env or repo root .env, restart npm run server:plaid. Check startup log: client_id suffix must match Keys page.`,
        `3) Dashboard → Developers → Integrations → Dwolla → Enable (same team as those keys). Toggle off/on, wait 1–2 minutes, retry.`,
        `4) Complete Company profile + App branding if the Dashboard still shows setup tasks.`,
        request_id ? `5) If still failing: Plaid Support with request_id ${request_id}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    } else if (error_code === 'INVALID_PRODUCT' || msgLc.includes('processor')) {
      hint =
        'Enable the partner integration in Plaid Dashboard → Developers → Integrations, and use API keys from the same environment (Sandbox secret for sandbox).';
    }
    if (error_code === 'INVALID_ACCOUNT_ID') {
      hint = 'Pick the account again after re-linking the bank in the app.';
    }
    return {
      error: error_message || 'Plaid request failed',
      error_code,
      error_type,
      display_message,
      request_id,
      hint,
    };
  }
  return { error: e?.message || String(e), error_code: null, error_type: null, display_message: null, hint: null };
}

const app = express();
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-User-Id'],
  })
);
app.use(express.json());

function requireUserId(req, res) {
  const id = req.headers['x-user-id'];
  if (!id || typeof id !== 'string') {
    res.status(401).json({ error: 'Missing X-User-Id header (use signed-in Supabase user id).' });
    return null;
  }
  return id;
}

app.post('/api/plaid/create-link-token', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!clientId || !secret) {
    res.status(503).json({ error: 'Plaid is not configured on the server.' });
    return;
  }
  try {
    const { data } = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Fintech App',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: data.link_token, expiration: data.expiration });
  } catch (e) {
    console.error('[plaid] linkTokenCreate', e?.response?.data || e);
    res.status(500).json(formatPlaidAxiosError(e));
  }
});

app.post('/api/plaid/exchange-public-token', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const public_token = req.body?.public_token;
  if (!public_token || typeof public_token !== 'string') {
    res.status(400).json({ error: 'public_token required' });
    return;
  }
  try {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;
    const accountsRes = await plaidClient.accountsGet({ access_token });
    const accounts = accountsRes.data.accounts;
    userItems.set(userId, { access_token, item_id, accounts });
    res.json({
      item_id,
      accounts: accounts.map((a) => ({
        id: a.account_id,
        name: a.name,
        mask: a.mask,
        subtype: a.subtype,
        type: a.type,
      })),
    });
  } catch (e) {
    console.error('[plaid] exchange', e?.response?.data || e);
    res.status(500).json(formatPlaidAxiosError(e));
  }
});

app.get('/api/plaid/accounts', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const row = userItems.get(userId);
  if (!row) {
    res.json({ accounts: [] });
    return;
  }
  try {
    const { data } = await plaidClient.accountsGet({ access_token: row.access_token });
    row.accounts = data.accounts;
    res.json({
      accounts: data.accounts.map((a) => ({
        id: a.account_id,
        name: a.name,
        mask: a.mask,
        subtype: a.subtype,
        type: a.type,
      })),
    });
  } catch (e) {
    console.error('[plaid] accountsGet', e?.response?.data || e);
    res.status(500).json(formatPlaidAxiosError(e));
  }
});

/**
 * Sandbox payout simulation: verifies the account exists and returns a reference.
 * Production apps typically use Plaid Transfer (or your processor) for ACH credits.
 */
/**
 * Dwolla processor token (server-side Plaid access_token only).
 * POST body: { account_id: string }
 */
app.post('/api/plaid/dwolla-processor-token', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const row = userItems.get(userId);
  if (!row) {
    res.status(400).json({ error: 'No linked bank. Link an account in Plaid first.' });
    return;
  }
  const account_id = req.body?.account_id;
  if (!account_id || typeof account_id !== 'string') {
    res.status(400).json({ error: 'account_id required' });
    return;
  }
  const hasAccount = row.accounts.some((a) => a.account_id === account_id);
  if (!hasAccount) {
    res.status(400).json({ error: 'Unknown account for this user.' });
    return;
  }
  if (!clientId || !secret) {
    res.status(503).json({ error: 'Plaid is not configured on the server.' });
    return;
  }
  try {
    const { data: itemData } = await plaidClient.itemGet({ access_token: row.access_token });
    const item = itemData.item;
    if (!itemHasAuthProduct(item)) {
      res.status(400).json({
        error:
          'This bank link does not include Plaid Auth, which Dwolla requires for processor tokens. Unlink the bank in the app and link it again (the server requests Auth + Transactions).',
        error_code: 'PLAID_AUTH_MISSING_ON_ITEM',
        hint:
          'If you linked before Auth was added to link_token, you must go through Plaid Link again so the Item includes the auth product.',
      });
      return;
    }

    const { data } = await plaidClient.processorTokenCreate({
      access_token: row.access_token,
      account_id,
      processor: Processor.Dwolla,
    });
    res.json({ processor_token: data.processor_token });
  } catch (e) {
    console.error('[plaid] processorTokenCreate', e?.response?.data || e);
    const payload = formatPlaidAxiosError(e);
    if (!payload.hint) {
      payload.hint =
        'Confirm Plaid Dashboard → Integrations → Dwolla is enabled. Re-link the bank if this Item was created without Auth.';
    }
    res.status(500).json(payload);
  }
});

/**
 * Upgrade a receive-only Dwolla customer to unverified (Dwolla sandbox).
 * Body: { customer_id: string } — UUID or full `.../customers/{id}` URL from your profile.
 */
app.post('/api/dwolla/upgrade-customer-to-unverified', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const customer_id = req.body?.customer_id;
  if (!customer_id || typeof customer_id !== 'string') {
    res.status(400).json({ error: 'customer_id required' });
    return;
  }
  const result = await upgradeDwollaCustomerToUnverified(customer_id);
  if (!result.ok) {
    const status =
      typeof result.status === 'number' && result.status >= 400 && result.status < 600
        ? result.status
        : 502;
    res.status(status).json({
      error: result.error ?? 'Dwolla upgrade failed',
      dwollaStatus: result.status,
      details: result.bodyText?.slice(0, 800) ?? null,
    });
    return;
  }
  res.json({ ok: true, dwollaStatus: result.status });
});

app.post('/api/plaid/sandbox-withdraw', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const row = userItems.get(userId);
  if (!row) {
    res.status(400).json({ error: 'No linked bank. Link an account in Plaid first.' });
    return;
  }
  const account_id = req.body?.account_id;
  const amount = req.body?.amount;
  if (!account_id || typeof account_id !== 'string') {
    res.status(400).json({ error: 'account_id required' });
    return;
  }
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  const hasAccount = row.accounts.some((a) => a.account_id === account_id);
  if (!hasAccount) {
    res.status(400).json({ error: 'Unknown account for this user.' });
    return;
  }
  const reference = `sandbox_wd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  res.json({
    status: 'simulated',
    reference,
    amount: amountNum.toFixed(2),
    account_id,
    environment: envName,
    message:
      'Sandbox-only: no real money moved. Enable Plaid Transfer and your ledger for production payouts.',
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, plaid_env: envName });
});

app.listen(PORT, () => {
  console.log(`Plaid sandbox API listening on http://localhost:${PORT}`);
});
