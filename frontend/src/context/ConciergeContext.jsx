import { createContext, useContext, useMemo, useState } from 'react';

const ConciergeContext = createContext(null);

export function ConciergeProvider({ children }) {
  const [context, setContext] = useState(null);

  const value = useMemo(
    () => ({
      context,
      setContext,
      clearContext: () => setContext(null),
    }),
    [context]
  );

  return <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>;
}

export function useConciergeContext() {
  const value = useContext(ConciergeContext);
  if (!value) {
    throw new Error('useConciergeContext must be used within a ConciergeProvider');
  }
  return value;
}
