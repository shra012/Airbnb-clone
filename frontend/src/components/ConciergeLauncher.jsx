import { forwardRef } from 'react';

const ConciergeLauncher = forwardRef(function ConciergeLauncher(
  { isOpen, onOpen, isBusy },
  ref
) {
  return (
    <div className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8">
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        className={`group flex items-center gap-3 rounded-full px-5 py-3 shadow-xl transition focus:outline-none focus:ring-2 focus:ring-airbnb-primary/40 ${
          isOpen
            ? 'bg-airbnb-primary text-white'
            : 'bg-white text-airbnb-primary hover:bg-airbnb-primary hover:text-white'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-busy={isBusy}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-airbnb-primary/10 text-xl group-hover:bg-white/20">
          {isBusy ? (
            <span
              className={`loading loading-ring loading-md ${isOpen ? 'text-white' : 'text-airbnb-primary'}`}
            />
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </span>
        <span className="text-sm font-semibold">
          {isBusy ? 'Planning your trip…' : 'AI Concierge'}
        </span>
      </button>
    </div>
  );
});

export default ConciergeLauncher;
