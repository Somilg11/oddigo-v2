import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
        <Toaster position="top-center" richColors />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
