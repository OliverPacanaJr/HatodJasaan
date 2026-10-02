'use client';

import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { emailConfirmationIsOn } from '@/lib/registration';

/** true while Supabase still has "Confirm email" switched ON (registration cannot work then). */
export function useEmailConfirmationOn() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    emailConfirmationIsOn().then((value) => {
      if (!cancelled) setOn(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return on;
}

export const SETUP_BLOCKED_MESSAGE =
  'Registration is paused: "Confirm email" is still ON in Supabase. See the red box above.';

export function SignupSetupWarning({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="font-semibold">Site owner: registration is switched off until one Supabase setting is changed</p>
          <p>
            Supabase is set to &quot;Confirm email&quot;, so new accounts are not signed in and nothing can be saved.
          </p>
          <ol className="list-decimal pl-5 space-y-0.5">
            <li>Supabase dashboard → Authentication → Sign In / Providers → Email</li>
            <li>Turn OFF &quot;Confirm email&quot; and press Save</li>
            <li>Authentication → Users: delete any test accounts</li>
            <li>Reload this page. This box disappears when it is fixed.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
