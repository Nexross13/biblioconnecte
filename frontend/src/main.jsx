import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles/index.css'

const queryClient = new QueryClient()
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (import.meta.env.DEV && !googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not defined: Google login button will be disabled.')
}

const defaultToastStyle = {
  background: 'rgba(34, 197, 94, 0.15)',
  border: '1px solid #15803d',
  color: '#064e3b',
  fontWeight: 600,
  borderRadius: '0.625rem',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(12px)',
}

const appTree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: defaultToastStyle,
          error: {
            style: {
              ...defaultToastStyle,
              background: 'rgba(248, 113, 113, 0.2)',
              border: '1px solid #b91c1c',
              color: '#7f1d1d',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  ) : (
    appTree
  ),
)
