import { redirect } from 'next/navigation';
import { signIn } from '../actions';
import { getSession } from '@/lib/session';
import { safeNext } from '@/lib/safe-next';
import { NO_INDEX } from '@/lib/seo';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to place and track your Addis Eats orders.',
  robots: NO_INDEX, // private: also excluded in robots.js
};
export const dynamic = 'force-dynamic';

// Server component, no client JS. The destination travels in `?next=`, is
// validated with safeNext() here (to render it) AND again in the signIn action
// (to redirect to it), because the hidden field is just as editable as the URL.
export default async function SignInPage({ searchParams }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);

  if (await getSession()) redirect(next);

  return (
    <div>
      <h1>Sign in</h1>
      {next !== '/' && <p className="muted">Sign in to continue.</p>}
      <form action={signIn} className="order-form">
        <input type="hidden" name="next" value={next} />
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required autoFocus aria-invalid={!!error} />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required aria-invalid={!!error} />
        </label>
        {error && <p className="field-error" role="alert">Email or password is incorrect.</p>}
        <button type="submit">Sign in</button>
      </form>
      <p className="muted">
        Demo accounts: abel@example.com / abel-password, selam@example.com / selam-password,
        kitchen@addis-eats.test / kitchen-password (staff).
      </p>
    </div>
  );
}
