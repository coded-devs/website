'use client';

import { useState, useEffect, Suspense, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../src/context/auth-context';
import { safeAdminRedirect } from '../../src/lib/auth-navigation';
import { FormField } from '../../src/components/admin-ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = safeAdminRedirect(searchParams.get('from'));

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(redirectTarget);
    }
  }, [status, user, router, redirectTarget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
      router.replace(redirectTarget);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please verify your credentials and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="login-screen">
        <p role="status">Checking authentication session...</p>
      </main>
    );
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">CodedDevs Admin</div>
        <header>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to manage company website content.</p>
        </header>

        {errorMessage && (
          <div role="alert" className="login-alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate={false}>
          <FormField label="Email Address" htmlFor="admin-email">
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="email"
              autoFocus
            />
          </FormField>

          <FormField label="Password" htmlFor="admin-password">
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="current-password"
            />
          </FormField>

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-screen">
          <p role="status">Loading login screen...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
