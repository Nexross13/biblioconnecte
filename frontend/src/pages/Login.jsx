import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import useAuth from '../hooks/useAuth'

const Login = () => {
  const { login, googleLogin, isAuthenticated, loginStatus, googleLoginStatus } = useAuth()
  const navigate = useNavigate()
  const isGoogleAuthEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const identifierInput = (formData.get('identifier') || '').trim()
    const payload = {
      password: formData.get('password'),
      identifier: identifierInput,
    }

    if (!payload.identifier || !payload.password) {
      toast.error('Veuillez renseigner votre login ou email ainsi que votre mot de passe')
      return
    }

    if (payload.identifier.includes('@')) {
      payload.email = payload.identifier.toLowerCase()
    } else {
      payload.login = payload.identifier.toLowerCase()
    }

    try {
      await login(payload)
      navigate('/')
    } catch {
      // toast already handled by AuthContext
    }
  }

  const handleGoogleSuccess = async (response) => {
    if (!response?.credential) {
      toast.error('Jeton Google manquant')
      return
    }
    try {
      await googleLogin({ credential: response.credential })
      navigate('/')
    } catch {
      // toast already handled by AuthContext
    }
  }

  const handleGoogleError = () => {
    toast.error('Connexion Google refusée')
  }

  return (
    <section className="mx-auto mt-10 max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Connexion</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Connectez-vous pour accéder à votre bibliothèque personnalisée.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="email">
            Email ou login
          </label>
          <input
            className="input"
            id="email"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="ex: alice ou alice@example.com"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
            htmlFor="password"
          >
            Mot de passe
          </label>
          <input className="input" id="password" name="password" type="password" />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <button type="submit" className="btn w-full" disabled={loginStatus === 'pending'}>
          {loginStatus === 'pending' ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      {isGoogleAuthEnabled && (
        <>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">ou</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
            />
          </div>
          {googleLoginStatus === 'pending' && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-300">
              Vérification de votre compte Google…
            </p>
          )}
        </>
      )}
      <p className="text-center text-sm text-slate-500 dark:text-slate-300">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </section>
  )
}

export default Login
