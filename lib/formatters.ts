/** Format 10-digit US phone for display */
export function formatUSPhoneDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function formatMoneyFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function emailLocalPart(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email.trim() || 'user';
  return email.slice(0, at).replace(/[^a-zA-Z0-9._-]/g, '') || 'user';
}
