import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { resetPasswordWithCode, verifyPasswordResetCode } from '../api/auth'

const normalizeEmail = (value) => value?.trim().toLowerCase() || ''

const ForgotPasswordReset = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email] = useState(() => normalizeEmail(searchParams.get('email')))
  const [code, setCode] = useState('')
  const [validatedCode, setValidatedCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!email) {
      toast.error('Adresse email manquante, veuillez recommencer la procédure.')
    }
  }, [email])

  const codeToSubmit = useMemo(() => code.trim(), [code])
  const isCodeValidated = useMemo(
    () => validatedCode.length === 6 && validatedCode === codeToSubmit,
    [validatedCode, codeToSubmit],
  )

  const verifyMutation = useMutation({
    mutationFn: verifyPasswordResetCode,
    onSuccess: () => {
      setValidatedCode(codeToSubmit)
      toast.success('Code validé, vous pouvez définir un nouveau mot de passe.')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Code expiré ou invalide'
      toast.error(message)
      setValidatedCode('')
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetPasswordWithCode,
    onSuccess: () => {
      toast.success('Votre mot de passe a été mis à jour. Vous pouvez désormais vous connecter.')
      navigate('/login')
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Impossible de mettre à jour le mot de passe pour l'instant"
      toast.error(message)
    },
  })

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    if (!email) {
      return
    }
    if (!/^\d{6}$/.test(codeToSubmit)) {
      toast.error('Merci de saisir le code à 6 chiffres reçu par email.')
      return
    }
    verifyMutation.mutate({ email, code: codeToSubmit })
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    if (!email) {
      toast.error('Adresse email manquante, veuillez recommencer la procédure.')
      return
    }
    if (!isCodeValidated) {
      toast.error('Veuillez d’abord valider votre code à 6 chiffres.')
      return
    }
    if (!password.trim() || password.trim().length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password.trim() !== confirmPassword.trim()) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }

    resetMutation.mutate({ email, code: validatedCode, password: password.trim() })
  }

  if (!email) {
    return (
      <section className="mx-auto mt-10 max-w-md space-y-6">
        <div className="card space-y-3 text-center">
          <h1 className="text-2xl font-semibold text-primary">Recommencez la procédure</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Nous avons besoin de votre adresse email pour vérifier le code de sécurité.
          </p>
          <Link to="/forgot-password" className="btn">
            Retour à la page « Mot de passe oublié »
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-10 max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Vérifier le code</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Entrez le code reçu sur <span className="font-semibold text-primary">{email}</span>, puis
          définissez un nouveau mot de passe.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Vous n&apos;avez rien reçu ? Vérifiez vos spams ou{' '}
          <Link to="/forgot-password" className="underline">
            demandez un nouveau code
          </Link>
          .
        </p>
      </div>

      <form className="card space-y-4" onSubmit={handleVerifyCode}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="code">
            Code de vérification
          </label>
          <input
            className="input tracking-[0.5em]"
            id="code"
            name="code"
            inputMode="numeric"
            maxLength={6}
            disabled={isCodeValidated}
            value={code}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(nextValue)
              if (validatedCode && nextValue !== validatedCode) {
                setValidatedCode('')
              }
            }}
            placeholder="123456"
          />
        </div>
        <button
          type="submit"
          className="btn w-full"
          disabled={verifyMutation.status === 'pending' || !code.trim() || isCodeValidated}
        >
          {isCodeValidated ? 'Code validé' : verifyMutation.status === 'pending' ? 'Validation…' : 'Valider le code'}
        </button>
      </form>

      {isCodeValidated && (
        <form className="card space-y-4" onSubmit={handleResetPassword}>
          <div className="space-y-1 text-sm text-emerald-600 dark:text-emerald-400">
            <span className="font-medium">Étape 2&nbsp;:</span> Code vérifié, choisissez un nouveau
            mot de passe.
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
              htmlFor="password"
            >
              Nouveau mot de passe
            </label>
            <input
              className="input"
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Au moins 8 caractères"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
              htmlFor="password-confirmation"
            >
              Confirmer le mot de passe
            </label>
            <input
              className="input"
              id="password-confirmation"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Répétez votre mot de passe"
            />
          </div>
          <button type="submit" className="btn w-full" disabled={resetMutation.status === 'pending'}>
            {resetMutation.status === 'pending' ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      )}
    </section>
  )
}

export default ForgotPasswordReset
