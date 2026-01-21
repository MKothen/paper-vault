import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FeatureFlagProvider } from './providers/FeatureFlagProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <FeatureFlagProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </FeatureFlagProvider>
    </ToastProvider>
  </StrictMode>,
)
