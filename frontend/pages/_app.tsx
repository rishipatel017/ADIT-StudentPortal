import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary, NotificationProvider, ErrorPage } from '../components/UI';

export default function App({ Component, pageProps }: AppProps) {
  const [criticalError, setCriticalError] = useState<{message: string, status: string | number} | null>(null);

  useEffect(() => {
    const handleError = (event: any) => {
      setCriticalError(event.detail);
    };

    window.addEventListener('app-critical-error', handleError);
    return () => window.removeEventListener('app-critical-error', handleError);
  }, []);

  if (criticalError) {
    return <ErrorPage message={criticalError.message} code={criticalError.status} />;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
