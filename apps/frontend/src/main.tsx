import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { startDevToolsProtection } from './lib/devtools-protection';
import favicon from '../image/logo-wego.png';

const enableDevtoolsProtection = import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION === 'true';
if (import.meta.env.PROD && enableDevtoolsProtection) {
  startDevToolsProtection();
}

const qc = new QueryClient();

const routerOptions: any = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
};

const router = createBrowserRouter([
  { path: '/*', element: <App /> },
], routerOptions);

// Set favicon at runtime so tab shows project logo image
try {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.setAttribute('rel', 'icon');
  link.setAttribute('href', (favicon as unknown) as string);
  link.setAttribute('type', 'image/png');
  link.setAttribute('sizes', '32x32');
  if (!document.querySelector("link[rel~='icon']")) document.getElementsByTagName('head')[0].appendChild(link);
} catch (e) {
  // ignore if setting favicon fails
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);