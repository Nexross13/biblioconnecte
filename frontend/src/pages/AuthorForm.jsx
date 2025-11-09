import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createAuthorProposal } from '../api/authorProposals'

const initialValues = {
  firstName: '',
  lastName: '',
  biography: '',
}

const BIO_MAX_LENGTH = 2000

const AuthorForm = () => {
  const [formValues, setFormValues] = useState(initialValues)
  const [feedback, setFeedback] = useState(null)

  const createAuthorMutation = useMutation({
    mutationFn: createAuthorProposal,
    onSuccess: (proposal) => {
      setFeedback({
        type: 'success',
        message: `Merci ! ${proposal.firstName} ${proposal.lastName} a bien été soumis à l'équipe.`,
      })
      setFormValues(initialValues)
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        "Impossible d'enregistrer l'auteur pour le moment. Merci de réessayer."
      setFeedback({ type: 'error', message })
    },
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFeedback(null)

    const payload = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      biography: formValues.biography.trim(),
    }

    if (!payload.firstName || !payload.lastName) {
      setFeedback({ type: 'error', message: 'Le prénom et le nom sont obligatoires.' })
      return
    }

    createAuthorMutation.mutate({
      firstName: payload.firstName,
      lastName: payload.lastName,
      biography: payload.biography || undefined,
    })
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Proposer un nouvel auteur</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Partage les talents littéraires que tu souhaites voir apparaître sur My BiblioConnect.
          Notre équipe vérifiera les informations avant de l’intégrer au catalogue.
        </p>
      </header>

      <div className="card space-y-6">
        {feedback ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-100'
            }`}
            role="status"
          >
            {feedback.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-semibold text-primary">
                <span className="text-rose-500" aria-hidden="true">
                  *
                </span>{' '}
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                className="input"
                placeholder="Ursula"
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-semibold text-primary">
                <span className="text-rose-500" aria-hidden="true">
                  *
                </span>{' '}
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                className="input"
                placeholder="Le Guin"
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="biography" className="text-sm font-semibold text-primary">
              Courte biographie
            </label>
            <textarea
              id="biography"
              name="biography"
              value={formValues.biography}
              onChange={handleChange}
              rows={6}
              className="input min-h-[160px]"
              placeholder="Parle-nous de son univers, de ses œuvres marquantes ou de son impact sur la communauté..."
              maxLength={BIO_MAX_LENGTH}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formValues.biography.length}/{BIO_MAX_LENGTH} caractères
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
            <p className="font-semibold text-primary">Conseils</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Vérifie l’orthographe des noms et prénoms avant d’envoyer.</li>
              <li>Ajoute, si possible, une brève description pour faciliter la validation.</li>
              <li>Tu peux proposer autant d’auteurs que tu le souhaites.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="btn w-full sm:w-auto"
              disabled={createAuthorMutation.isLoading}
            >
              {createAuthorMutation.isLoading ? 'Envoi en cours…' : 'Envoyer ma proposition'}
            </button>
            <p className="text-right text-xs text-rose-500 dark:text-rose-400">* Champs obligatoires</p>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AuthorForm
