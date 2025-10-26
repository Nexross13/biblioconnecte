import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuth from '../hooks/useAuth'

const Register = () => {
  const { register, isAuthenticated, registerStatus } = useAuth()
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
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
    }

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.password) {
      toast.error('Tous les champs sont obligatoires')
      return
    }

    try {
      await register(payload)
      navigate('/')
    } catch {
      // notifications gérées par le contexte
    }
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
        <button type="submit" className="btn w-full" disabled={registerStatus === 'pending'}>
          {registerStatus === 'pending' ? 'Création...' : 'Créer un compte'}
        </button>
      </form>
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
