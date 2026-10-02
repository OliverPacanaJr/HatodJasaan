import type { SupabaseClient } from '@supabase/supabase-js';

type HasError = { error: { message: string } | null };

const NETWORK_ERROR = /failed to fetch|load failed|networkerror|network request failed/i;

function messageOf(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : (err as { message?: string } | null)?.message ?? String(err);
  return NETWORK_ERROR.test(raw)
    ? `${raw}. The browser could not reach Supabase. Check your internet connection, turn off ad-blockers or VPN, ` +
        'and make sure NEXT_PUBLIC_SUPABASE_URL in Vercel is correct.'
    : raw;
}

/** Runs one registration step. A failure is reported as "<step>: <reason>" instead of being silently ignored. */
export async function must<T extends HasError>(label: string, request: PromiseLike<T>): Promise<T> {
  let result: T;
  try {
    result = await request;
  } catch (err) {
    throw new Error(`${label}: ${messageOf(err)}`);
  }
  if (result.error) throw new Error(`${label}: ${messageOf(result.error)}`);
  return result;
}

/** Sign-up must come back with a signed-in session, otherwise nothing after it is allowed to save. */
export function requireSignedIn(data: { user: { id: string } | null; session: unknown | null }): string {
  if (!data.user) throw new Error('Creating account: no user was returned');
  if (!data.session) {
    throw new Error(
      'Your account was created but you were not signed in, so your details and documents could not be saved. ' +
        'Site owner: in Supabase turn OFF "Confirm email" (Authentication > Sign In / Providers > Email), ' +
        'delete this test user under Authentication > Users, then register again.'
    );
  }
  return data.user.id;
}

/** Saves the contact details on the profile row that the sign-up trigger created. */
export async function saveProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: { phone: string; barangay: string; address: string }
) {
  const { data } = await must(
    'Saving profile',
    supabase.from('profiles').update(fields).eq('id', userId).select('id')
  );
  if (!data || data.length === 0) {
    throw new Error(
      'Saving profile: no profile row exists for this account. ' +
        'Site owner: run supabase/migrations/002_fix_signup_storage_security.sql in the Supabase SQL Editor.'
    );
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Uploads one verification document and returns the URL to store in the database. */
export async function uploadDocument(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  file: File
): Promise<string> {
  const label = `Uploading ${type.replace(/_/g, ' ')}`;
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${userId}/${type}.${extension}`;
  const contentType = file.type || 'image/jpeg';

  // Copy the photo into memory first. On some phones the original file handle goes stale while the
  // page is busy, which makes the upload fail with a bare "Failed to fetch".
  let body: Blob;
  try {
    body = new Blob([await file.arrayBuffer()], { type: contentType });
  } catch {
    throw new Error(`${label}: could not read the selected photo. Please choose it again, or pick a different photo.`);
  }

  // Try up to 3 times, but only when the network itself failed (a permission error will not fix itself).
  for (let attempt = 1; ; attempt++) {
    try {
      await must(label, supabase.storage.from('documents').upload(path, body, { upsert: true, contentType }));
      break;
    } catch (err) {
      const networkProblem = err instanceof Error && NETWORK_ERROR.test(err.message);
      if (!networkProblem || attempt >= 3) throw err;
      await sleep(1000 * attempt);
    }
  }

  return supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;
}

/**
 * Asks Supabase whether new sign-ups get a session straight away ("Confirm email" switched OFF).
 * Registration saves details and documents right after sign-up, which only works in that case.
 * Fails open: if the check itself cannot be done, registration is not blocked.
 */
export async function emailConfirmationIsOn(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url.trim().replace(/\/+$/, '')}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    if (!res.ok) return false;
    const settings = await res.json();
    return settings?.mailer_autoconfirm === false;
  } catch {
    return false;
  }
}
