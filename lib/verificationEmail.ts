import { supabase } from './supabase';

export type SendVerificationResult = {
  error: Error | null;
  statusCode?: number;
};

/**
 * Sends a verification email via Supabase Auth (e.g. resend after signup).
 */
export async function sendVerificationEmail(email: string): Promise<SendVerificationResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
  });
  const err = error as Error & { status?: number } | null;
  return {
    error: err,
    statusCode: err && typeof err === 'object' && 'status' in err ? err.status : undefined,
  };
}
