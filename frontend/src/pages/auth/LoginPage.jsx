import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthActions, useCurrentUser } from '../../hooks/useAuth';

const initialForm = {
  email: '',
  password: '',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthActions();
  const {
    data: user,
    isLoading: isCheckingSession,
    refetch,
  } = useCurrentUser();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from ?? null;

  useEffect(() => {
    if (!isCheckingSession && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [isCheckingSession, navigate, redirectTo, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(form);
      await refetch();
      const fallback = user?.role === 'OWNER' ? '/owner/dashboard' : '/traveler/dashboard';
      navigate(redirectTo || fallback, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="form-control">
        <label htmlFor="email" className="label">
          <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Email address
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input input-lg rounded-2xl border-base-200 bg-base-100 focus:border-airbnb-primary focus:outline-none focus:ring-2 focus:ring-airbnb-primary/20"
          placeholder="your-email@domain.com"
          value={form.email}
          onChange={handleChange}
        />
      </div>
      <div className="form-control">
        <label htmlFor="password" className="label">
          <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Password
          </span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input input-lg rounded-2xl border-base-200 bg-base-100 focus:border-airbnb-primary focus:outline-none focus:ring-2 focus:ring-airbnb-primary/20"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
        />
        <div className="mt-2 text-right text-xs text-airbnb-charcoal/60">
          <button type="button" className="link link-hover text-airbnb-primary">
            Forgot password?
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="btn btn-primary btn-lg rounded-2xl border-none text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading ? <span className="loading loading-spinner" /> : 'Sign in'}
      </button>
      <div className="text-center text-sm text-airbnb-charcoal/60">
        Don’t have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-airbnb-primary">
          Create one now
        </Link>
      </div>
    </form>
  );
}
