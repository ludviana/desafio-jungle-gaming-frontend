import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import '@fontsource-variable/roboto-mono';
import { marketplace } from './app/container';
import { routeTree } from './app/router/routes';
import { MarketplaceProvider } from './presentation/shared/MarketplaceProvider';
import './presentation/presentation-global-styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function prepareApp() {
  const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';
  if (mocksEnabled) {
    const { worker } = await import('./infrastructure/mock-server/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepareApp()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <MarketplaceProvider value={marketplace}>
            <RouterProvider router={router} />
          </MarketplaceProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error('Não foi possível iniciar a aplicação.', error);
    const root = document.getElementById('root');
    if (root)
      root.textContent =
        'Falha ao iniciar a aplicação. Verifique a configuração dos mocks e tente novamente.';
  });
