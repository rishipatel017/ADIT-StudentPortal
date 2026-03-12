import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary, NotificationProvider } from '../components/UI';

export default function App({ Component, pageProps }: AppProps) {
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
