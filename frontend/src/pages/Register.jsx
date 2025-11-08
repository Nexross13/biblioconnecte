import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import useAuth from '../hooks/useAuth'
import { isLoginValid, normalizeLogin } from '../utils/login'

const Register = () => {
  const { register, googleLogin, isAuthenticated, registerStatus, googleLoginStatus } = useAuth()
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
    const payload = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      login: normalizeLogin(formData.get('login')),
      email: formData.get('email'),
      password: formData.get('password'),
      dateOfBirth: formData.get('dateOfBirth') || null,
    }

    if (!payload.firstName || !payload.lastName || !payload.login || !payload.email || !payload.password) {
      toast.error('Tous les champs sont obligatoires')
      return
    }

    if (!isLoginValid(payload.login)) {
      toast.error('Le login doit contenir 3 à 30 caractères (lettres/chiffres .-_).')
      return
    }

    if (payload.dateOfBirth === '') {
      payload.dateOfBirth = null
    }

    try {
      await register(payload)
      navigate('/')
    } catch {
      // notifications gérées par le contexte
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
      // notifications gérées par le contexte
    }
  }

  const handleGoogleError = () => {
    toast.error('Connexion Google refusée')
  }

  return (
    <section className="mx-auto mt-10 max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Rejoignez la communauté et partagez vos bibliothèques avec vos amis.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
              htmlFor="firstName"
            >
              Prénom
            </label>
            <input className="input" id="firstName" name="firstName" autoComplete="given-name" />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
              htmlFor="lastName"
            >
              Nom
            </label>
            <input className="input" id="lastName" name="lastName" autoComplete="family-name" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="login">
            Login (public)
          </label>
          <input
            className="input"
            id="login"
            name="login"
            autoComplete="username"
            placeholder="ex: bibliogirl92"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            3-30 caractères, lettres/chiffres avec .-_ uniquement.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="email">
            Email
          </label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
            htmlFor="dateOfBirth"
          >
            Date de naissance
          </label>
          <input className="input" id="dateOfBirth" name="dateOfBirth" type="date" />
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
        <button type="submit" className="btn w-full" disabled={registerStatus === 'pending'}>
          {registerStatus === 'pending' ? 'Création...' : 'Créer un compte'}
        </button>
      </form>
      {isGoogleAuthEnabled && (
        <>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">ou</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
            />
            {googleLoginStatus === 'pending' && (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Vérification de votre compte Google…
              </p>
            )}
          </div>
        </>
      )}
      <p className="text-center text-sm text-slate-500 dark:text-slate-300">
        Vous avez déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </section>
  )
}

export default Register
