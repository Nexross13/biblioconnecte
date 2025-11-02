import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { requestPasswordReset } from '../api/auth'

const ForgotPasswordRequest = () => {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const resetRequest = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_, variables) => {
      const normalizedEmail = variables.email.trim().toLowerCase()
      toast.success('Si un compte existe, un code à usage unique vient de lui être envoyé.')
      navigate({
        pathname: '/forgot-password/reset',
        search: `?email=${encodeURIComponent(normalizedEmail)}`,
      })
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Impossible d'envoyer le code pour le moment"
      toast.error(message)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Veuillez indiquer votre adresse email')
      return
    }

    resetRequest.mutate({ email: trimmedEmail })
  }

  return (
    <section className="mx-auto mt-10 max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Saisissez votre adresse email pour recevoir un code de vérification à 6 chiffres.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button type="submit" className="btn w-full" disabled={resetRequest.status === 'pending'}>
          {resetRequest.status === 'pending' ? 'Envoi en cours...' : 'Envoyer le code'}
        </button>
      </form>
    </section>
  )
}

export default ForgotPasswordRequest
