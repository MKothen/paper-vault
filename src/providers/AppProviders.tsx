import { ErrorBoundary } from '../components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '../components/Toast';
import { AuthProvider } from '../providers/AuthProvider';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
