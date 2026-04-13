/**
 * Upgrade a Dwolla sandbox receive-only user to an unverified customer (send + receive).
 * @see https://developers.dwolla.com/docs/api-reference/customers/update-a-customer (UpgradeToUnverified)
 */

const DWOLLA_SANDBOX_CUSTOMERS = 'https://api-sandbox.dwolla.com/customers';
const DWOLLA_ACCEPT = 'application/vnd.dwolla.v1.hal+json';

/**
 * @param {string} customerId — Dwolla customer UUID or full customer resource URL
 * @returns {string}
 */
export function normalizeDwollaCustomerId(customerId) {
  const s = String(customerId ?? '').trim();
  if (!s) throw new Error('customerId is required');
  const fromUrl = s.match(/\/customers\/([^/?#]+)\/?$/i);
  if (fromUrl) return fromUrl[1];
  return s;
}

/**
 * POST https://api-sandbox.dwolla.com/customers/{id} with { type: "unverified" }.
 * Uses process.env.DWOLLA_ACCESS_TOKEN (Bearer).
 *
 * @param {string} customerId
 * @returns {Promise<{ ok: true, status: number, bodyText: string } | { ok: false, status?: number, bodyText?: string, error: string }>}
 */
export async function upgradeDwollaCustomerToUnverified(customerId) {
  const accessToken = process.env.DWOLLA_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    const msg = 'DWOLLA_ACCESS_TOKEN is not set';
    console.error('[dwolla] upgradeToUnverified:', msg);
    return { ok: false, error: msg };
  }

  let id;
  try {
    id = normalizeDwollaCustomerId(customerId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[dwolla] upgradeToUnverified:', msg);
    return { ok: false, error: msg };
  }

  const url = `${DWOLLA_SANDBOX_CUSTOMERS}/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: DWOLLA_ACCEPT,
      },
      body: JSON.stringify({ type: 'unverified' }),
    });

    const bodyText = await res.text();
    console.log(
      '[dwolla] upgradeToUnverified response',
      JSON.stringify({ customerId: id, status: res.status, bodyPreview: bodyText.slice(0, 500) })
    );

    if (!res.ok) {
      console.error('[dwolla] upgradeToUnverified failed', res.status, bodyText);
      return { ok: false, status: res.status, bodyText, error: `Dwolla returned ${res.status}` };
    }

    return { ok: true, status: res.status, bodyText };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[dwolla] upgradeToUnverified network error', message);
    return { ok: false, error: message };
  }
}
