import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { createBook } from '../api/books'
import Loader from '../components/Loader.jsx'

const initialState = {
  title: '',
  isbn: '',
  edition: '',
  volume: '',
  summary: '',
}

const BookProposalForm = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState(initialState)
  const [errors, setErrors] = useState({})

  const prefilledTitle = useMemo(
    () => searchParams.get('title')?.trim() || '',
    [searchParams],
  )

  useEffect(() => {
    if (prefilledTitle) {
      setFormValues((prev) => ({ ...prev, title: prefilledTitle }))
    }
  }, [prefilledTitle])

  const mutation = useMutation({
    mutationFn: createBook,
    onSuccess: (data) => {
      if (data.book) {
        toast.success(`Le livre « ${data.book.title} » a été créé.`)
        navigate(`/books/${data.book.id}`)
      } else if (data.proposal) {
        toast.success(`Votre proposition « ${data.proposal.title} » a été envoyée.`)
        navigate('/dashboard')
      } else if (data.message) {
        toast.success(data.message)
        navigate('/dashboard')
      } else {
        toast.success('Action effectuée.')
        navigate('/dashboard')
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Impossible d'enregistrer votre proposition pour le moment."
      toast.error(message)
    },
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!formValues.title.trim()) {
      nextErrors.title = 'Le titre est obligatoire.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    const payload = {
      title: formValues.title.trim(),
      isbn: formValues.isbn.trim() || null,
      edition: formValues.edition.trim() || null,
      volume: formValues.volume.trim() || null,
      summary: formValues.summary.trim() || null,
    }

    mutation.mutate(payload)
  }

  if (mutation.isPending) {
    return <Loader label="Enregistrement en cours..." />
  }

  return (
    <section className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Proposer un nouveau livre</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Renseignez les informations principales du livre que vous souhaitez ajouter au catalogue.
          Les administrateurs vérifieront la proposition avant publication.
        </p>
      </header>

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-primary">
            Titre *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="input"
            placeholder="Ex. La Horde du Contrevent"
            value={formValues.title}
            onChange={handleChange}
            required
          />
          {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="isbn" className="text-sm font-semibold text-primary">
              ISBN
            </label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              className="input"
              placeholder="ISBN (10 ou 13 chiffres)"
              value={formValues.isbn}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edition" className="text-sm font-semibold text-primary">
              Édition
            </label>
            <input
              id="edition"
              name="edition"
              type="text"
              className="input"
              placeholder="Maison d’édition"
              value={formValues.edition}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="volume" className="text-sm font-semibold text-primary">
              Tome / Volume
            </label>
            <input
              id="volume"
              name="volume"
              type="text"
              className="input"
              placeholder="Ex. Tome 1"
              value={formValues.volume}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="summary" className="text-sm font-semibold text-primary">
            Résumé
          </label>
          <textarea
            id="summary"
            name="summary"
            className="input min-h-[160px]"
            placeholder="Partagez un résumé ou les éléments clés de l’ouvrage."
            value={formValues.summary}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <button type="submit" className="btn">
            Envoyer la proposition
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFormValues({ ...initialState, title: prefilledTitle })
              setErrors({})
            }}
          >
            Réinitialiser le formulaire
          </button>
        </div>
      </form>
    </section>
  )
}

export default BookProposalForm
