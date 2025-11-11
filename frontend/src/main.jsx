import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import './index.css';
import { queryClient } from './lib/queryClient';
import { store } from './store';
import RealtimeProvider from './providers/RealtimeProvider.jsx';

document.documentElement.setAttribute('data-theme', 'airbnb');
document.body.classList.add('bg-base-200');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <App />
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </RealtimeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
