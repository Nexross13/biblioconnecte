import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuth from '../hooks/useAuth'

const Login = () => {
  const { login, isAuthenticated, loginStatus } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    }
    if (!payload.email || !payload.password) {
      toast.error('Veuillez renseigner votre email et votre mot de passe')
      return
    }

    try {
      await login(payload)
      navigate('/')
    } catch {
      // toast already handled by AuthContext
    }
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
            Email
          </label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" />
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
        <button type="submit" className="btn w-full" disabled={loginStatus === 'pending'}>
          {loginStatus === 'pending' ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
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
