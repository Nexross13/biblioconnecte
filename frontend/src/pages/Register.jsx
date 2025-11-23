import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import useAuth from '../hooks/useAuth'
import { isLoginValid, normalizeLogin } from '../utils/login'
import inscriptionIllustration from '../assets/components/img/inscription.png'

const Register = () => {
  const { register, googleLogin, isAuthenticated, registerStatus, googleLoginStatus } = useAuth()
  const navigate = useNavigate()
  const isGoogleAuthEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

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

    if (payload.dateOfBirth === '') {
      payload.dateOfBirth = null
    }

    const errors = {}

    if (!payload.firstName?.trim()) {
      errors.firstName = 'Prénom requis'
    }
    if (!payload.lastName?.trim()) {
      errors.lastName = 'Nom requis'
    }
    if (!payload.login?.trim()) {
      errors.login = 'Login requis'
    } else if (!isLoginValid(payload.login)) {
      errors.login = '3-30 caractères, lettres/chiffres avec .-_ uniquement.'
    }
    if (!payload.email?.trim()) {
      errors.email = 'Email requis'
    }
    if (!payload.password) {
      errors.password = 'Mot de passe requis'
    } else if (payload.password.length < 8) {
      errors.password = 'Mot de passe trop court (8+ caractères)'
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length) {
      toast.error('Merci de corriger les champs en rouge')
      return
    }

    try {
      await register(payload)
      setFieldErrors({})
      navigate('/')
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      if (
        apiMessage &&
        /login/i.test(apiMessage) &&
        /(pris|existe|déjà|taken|used)/i.test(apiMessage)
      ) {
        setFieldErrors((prev) => ({ ...prev, login: apiMessage }))
      }
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
    <section className="mx-auto mt-10 max-w-6xl px-4">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="flex justify-center lg:justify-center">
          <img
            src={inscriptionIllustration}
            alt="Illustration d'inscription"
            className="w-full max-w-md object-contain"
          />
        </div>
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
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
                <input
                  className={`input ${fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-600 dark:text-slate-300"
                  htmlFor="lastName"
                >
                  Nom
                </label>
                <input
                  className={`input ${fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                htmlFor="login"
              >
                Login (public)
              </label>
              <input
                className={`input ${fieldErrors.login ? 'border-red-500 focus:ring-red-500' : ''}`}
                id="login"
                name="login"
                autoComplete="username"
                placeholder="ex: bibliogirl92"
              />
              {fieldErrors.login ? (
                <p className="text-xs text-red-600">{fieldErrors.login}</p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  3-30 caractères, lettres/chiffres avec .-_ uniquement.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className={`input ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
              />
              {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
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
              <div className="relative">
                <input
                  className={`input pr-12 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-primary focus:outline-none"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            <button type="submit" className="btn w-full" disabled={registerStatus === 'pending'}>
              {registerStatus === 'pending' ? 'Création...' : 'Créer un compte'}
            </button>
          </form>
          {isGoogleAuthEnabled && (
            <>
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  ou
                </span>
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
        </div>
      </div>
    </section>
  )
}

export default Register
