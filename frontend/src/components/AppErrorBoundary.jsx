import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useMemo } from 'react';

export default function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const { title, message, detail } = useMemo(() => {
    if (isRouteErrorResponse(error)) {
      return {
        title: `Error ${error.status}`,
        message: error.statusText || 'An unexpected error occurred.',
        detail: typeof error.data === 'string' ? error.data : null,
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Something went wrong',
        message: error.message || 'An unexpected error occurred.',
        detail: error.stack ?? null,
      };
    }

    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred.',
      detail: null,
    };
  }, [error]);

  const handleReload = () => {
    navigate(0);
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-base-200 px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-lg shadow-airbnb-charcoal/5">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-airbnb-charcoal/40">Oops…</p>
          <h1 className="text-3xl font-semibold text-airbnb-charcoal">{title}</h1>
          <p className="text-base text-airbnb-charcoal/70">{message}</p>
        </div>

        {detail ? (
          <details className="mt-6 rounded-2xl bg-base-200/60 p-4 text-left text-xs text-airbnb-charcoal/70">
            <summary className="cursor-pointer select-none text-sm font-medium text-airbnb-charcoal/80">
              Technical details
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
              {detail}
            </pre>
          </details>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary rounded-full px-6 text-white" onClick={handleReload}>
            Retry
          </button>
          <button type="button" className="btn btn-ghost rounded-full px-6" onClick={handleGoHome}>
            Go home
          </button>
          <button type="button" className="btn btn-ghost rounded-full px-6" onClick={handleGoBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
