import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { createBookProposal } from '../api/bookProposals'
import { fetchGenres } from '../api/genres'
import { fetchAuthors } from '../api/authors'
import Loader from '../components/Loader.jsx'

const getAuthorDisplayName = (author) => {
  const firstName = author.firstName ?? ''
  const lastName = author.lastName ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || author.email || `Auteur ${author.id}`
}

const initialState = {
  title: '',
  isbn: '',
  edition: '',
  volume: '',
  releaseDate: '',
  summary: '',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const STORAGE_KEY = 'book-proposal-draft'

const loadDraft = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saveDraft = (draft) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* no-op */
  }
}

const clearDraft = () => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* no-op */
  }
}

const BookProposalForm = () => {
  const [searchParams] = useSearchParams()
  const [formValues, setFormValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [authors, setAuthors] = useState([])
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false)
  const [authorModalSearch, setAuthorModalSearch] = useState('')
  const [authorModalSelection, setAuthorModalSelection] = useState([])
  const [genres, setGenres] = useState([])
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false)
  const [genreModalSelection, setGenreModalSelection] = useState([])
  const [genreModalSearch, setGenreModalSearch] = useState('')
  const [coverImageData, setCoverImageData] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const [coverError, setCoverError] = useState('')

  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  })

  const authorsQuery = useQuery({
    queryKey: ['authors'],
    queryFn: fetchAuthors,
  })

  const filteredGenres = useMemo(() => {
    const availableGenres = genresQuery.data ?? []
    const lower = genreModalSearch.trim().toLowerCase()
    return availableGenres.filter((genre) =>
      genre.name.toLowerCase().includes(lower),
    )
  }, [genresQuery.data, genreModalSearch])

  const filteredAuthors = useMemo(() => {
    const availableAuthors = authorsQuery.data ?? []
    const lower = authorModalSearch.trim().toLowerCase()
    return availableAuthors.filter((author) =>
      getAuthorDisplayName(author).toLowerCase().includes(lower),
    )
  }, [authorsQuery.data, authorModalSearch])

  const prefilledTitle = useMemo(
    () => searchParams.get('title')?.trim() || '',
    [searchParams],
  )

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) {
      return
    }
    if (draft.formValues) {
      setFormValues((prev) => ({ ...prev, ...draft.formValues }))
    }
    if (Array.isArray(draft.authors)) {
      setAuthors(draft.authors)
    }
    if (Array.isArray(draft.genres)) {
      setGenres(draft.genres)
    }
  }, [])

  useEffect(() => {
    if (prefilledTitle) {
      setFormValues((prev) => ({ ...prev, title: prefilledTitle }))
    }
  }, [prefilledTitle])

  useEffect(() => {
    const hasDraftContent =
      Object.values(formValues).some((value) =>
        typeof value === 'string' ? value.trim().length > 0 : Boolean(value),
      ) ||
      authors.length ||
      genres.length

    if (!hasDraftContent) {
      clearDraft()
      return
    }

    saveDraft({
      formValues,
      authors,
      genres,
    })
  }, [formValues, authors, genres])

  const mutation = useMutation({
    mutationFn: createBookProposal,
    onSuccess: (data) => {
      const title = data?.proposal?.title || formValues.title || 'Votre proposition'
      toast.success(`Votre proposition « ${title} » a été envoyée.`)

      setFormValues(initialState)
      setErrors({})
      setAuthors([])
      setAuthorModalSelection([])
      setAuthorModalSearch('')
      setGenres([])
      setGenreModalSelection([])
      setGenreModalSearch('')
      setCoverImageData(null)
      setCoverPreviewUrl(null)
      setCoverError('')
      clearDraft()
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

  const handleAuthorRemove = (name) => {
    setAuthors((prev) => prev.filter((value) => value !== name))
    setAuthorModalSelection((prev) => prev.filter((value) => value !== name))
  }

  const handleGenreRemove = (name) => {
    setGenres((prev) => prev.filter((value) => value !== name))
    setGenreModalSelection((prev) => prev.filter((value) => value !== name))
  }

  const openAuthorModal = () => {
    setAuthorModalSelection(authors)
    setAuthorModalSearch('')
    setIsAuthorModalOpen(true)
  }

  const closeAuthorModal = () => {
    setAuthorModalSelection(authors)
    setAuthorModalSearch('')
    setIsAuthorModalOpen(false)
  }

  const toggleAuthorSelection = (author) => {
    const displayName = getAuthorDisplayName(author)
    setAuthorModalSelection((prev) =>
      prev.includes(displayName)
        ? prev.filter((value) => value !== displayName)
        : [...prev, displayName],
    )
  }

  const confirmAuthorSelection = () => {
    setAuthors(authorModalSelection)
    if (errors.authorNames && authorModalSelection.length) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.authorNames
        return next
      })
    }
    setIsAuthorModalOpen(false)
    setAuthorModalSearch('')
  }

  const openGenreModal = () => {
    setGenreModalSelection(genres)
    setGenreModalSearch('')
    setIsGenreModalOpen(true)
  }

  const closeGenreModal = () => {
    setGenreModalSelection(genres)
    setGenreModalSearch('')
    setIsGenreModalOpen(false)
  }

  const toggleGenreSelection = (name) => {
    setGenreModalSelection((prev) =>
      prev.includes(name) ? prev.filter((value) => value !== name) : [...prev, name],
    )
  }

  const confirmGenreSelection = () => {
    setGenres(genreModalSelection)
    if (errors.genreNames && genreModalSelection.length) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.genreNames
        return next
      })
    }
    setIsGenreModalOpen(false)
    setGenreModalSearch('')
  }

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setCoverImageData(null)
      setCoverPreviewUrl(null)
      setCoverError('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setCoverError("Veuillez sélectionner un fichier d'image valide")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setCoverError('L’image de couverture doit faire moins de 5 Mo')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCoverImageData(reader.result)
      setCoverPreviewUrl(reader.result)
      setCoverError('')
    }
    reader.onerror = () => {
      setCoverError("Impossible de lire l'image sélectionnée")
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors = {}
    if (!formValues.title.trim()) {
      nextErrors.title = 'Le titre est obligatoire.'
    }
    if (!authors.length) {
      nextErrors.authorNames = 'Veuillez ajouter au moins un auteur.'
    }
    if (!genres.length) {
      nextErrors.genreNames = 'Veuillez ajouter au moins un genre.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      return
    }
    if (coverError) {
      toast.error(coverError)
      return
    }

    const payload = {
      title: formValues.title.trim(),
      isbn: formValues.isbn.trim() || null,
      edition: formValues.edition.trim() || null,
      volume: formValues.volume.trim() || null,
      releaseDate: formValues.releaseDate.trim() || null,
      summary: formValues.summary.trim() || null,
      authorNames: authors,
      genreNames: genres,
      coverImage: coverImageData,
    }

    mutation.mutate(payload)
  }

  if (mutation.isPending) {
    return <Loader label="Enregistrement en cours..." />
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
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
            Titre
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
              className="input h-10"
              placeholder="Ex. Tome 1"
              value={formValues.volume}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="releaseDate" className="text-sm font-semibold text-primary">
              Date de sortie
            </label>
            <input
              id="releaseDate"
              name="releaseDate"
              type="date"
              className="input h-10"
              placeholder="AAAA-MM-JJ"
              value={formValues.releaseDate}
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

        <div className="space-y-2">
          <span className="text-sm font-semibold text-primary">Auteur(s)</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="btn-secondary sm:w-auto"
              onClick={openAuthorModal}
              disabled={authorsQuery.isLoading || authorsQuery.isError}
            >
              Sélectionner les auteurs
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-300">
              {authors.length ? `${authors.length} auteur(s) sélectionné(s)` : 'Aucun auteur sélectionné'}
            </span>
          </div>
          {authorsQuery.isLoading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Chargement des auteurs...</p>
          ) : null}
          {authorsQuery.isError ? (
            <p className="text-xs text-rose-600">Impossible de charger les auteurs enregistrés.</p>
          ) : null}
          {errors.authorNames && <p className="text-xs text-rose-600">{errors.authorNames}</p>}
          {authors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {authors.map((author) => (
                <span
                  key={author}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {author}
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary-dark"
                    onClick={() => handleAuthorRemove(author)}
                    aria-label={`Retirer ${author}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-primary">Genre(s)</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="btn-secondary sm:w-auto"
              onClick={openGenreModal}
              disabled={genresQuery.isLoading || genresQuery.isError}
            >
              Sélectionner les genres
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-300">
              {genres.length ? `${genres.length} genre(s) sélectionné(s)` : 'Aucun genre sélectionné'}
            </span>
          </div>
          {genresQuery.isLoading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Chargement des genres...</p>
          ) : null}
          {genresQuery.isError ? (
            <p className="text-xs text-rose-600">Impossible de charger les genres enregistrés.</p>
          ) : null}
          {errors.genreNames && <p className="text-xs text-rose-600">{errors.genreNames}</p>}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary"
                >
                  {genre}
                  <button
                    type="button"
                    className="text-xs text-secondary hover:text-teal-500"
                    onClick={() => handleGenreRemove(genre)}
                    aria-label={`Retirer ${genre}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary" htmlFor="coverImage">
            Image de couverture
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleCoverChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark dark:text-slate-200"
          />
          {coverError && <p className="text-xs text-rose-600">{coverError}</p>}
          {coverPreviewUrl && !coverError && (
            <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
              <img
                src={coverPreviewUrl}
                alt="Prévisualisation de la couverture"
                className="h-64 w-full object-contain bg-slate-100 dark:bg-slate-800"
              />
            </div>
          )}
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
              setAuthors([])
              setAuthorModalSelection([])
              setGenres([])
              setGenreModalSelection([])
              setGenreModalSearch('')
              setAuthorModalSearch('')
              setCoverImageData(null)
              setCoverPreviewUrl(null)
              setCoverError('')
              clearDraft()
            }}
          >
            Réinitialiser le formulaire
          </button>
        </div>
      </form>
      {isAuthorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Sélectionner les auteurs</h2>
              <button
                type="button"
                className="text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={closeAuthorModal}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              className="input"
              placeholder="Rechercher un auteur"
              value={authorModalSearch}
              onChange={(event) => setAuthorModalSearch(event.target.value)}
              disabled={authorsQuery.isLoading || authorsQuery.isError}
            />

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {authorsQuery.isLoading ? (
                <p className="p-3 text-sm text-slate-500 dark:text-slate-300">Chargement...</p>
              ) : filteredAuthors.length ? (
                filteredAuthors.map((author) => {
                  const displayName = getAuthorDisplayName(author)
                  const isSelected = authorModalSelection.includes(displayName)
                  return (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => toggleAuthorSelection(author)}
                      className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
                        isSelected
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'text-slate-600 hover:bg-primary/10 dark:text-slate-200 dark:hover:bg-primary/20'
                      }`}
                    >
                      <span>{displayName}</span>
                      {isSelected ? <span className="text-xs">Sélectionné</span> : null}
                    </button>
                  )
                })
              ) : (
                <p className="p-3 text-sm text-slate-500 dark:text-slate-300">
                  Aucun auteur ne correspond à votre recherche.
                </p>
              )}
            </div>

            {authorModalSelection.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {authorModalSelection.map((author) => (
                  <span
                    key={author}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {author}
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={() => {
                        setAuthors((prev) => prev.filter((value) => value !== author))
                        setAuthorModalSelection((prev) => prev.filter((value) => value !== author))
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={closeAuthorModal}>
                Annuler
              </button>
              <button type="button" className="btn" onClick={confirmAuthorSelection}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
      {isGenreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Sélectionner les genres</h2>
              <button
                type="button"
                className="text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={closeGenreModal}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              className="input"
              placeholder="Rechercher un genre"
              value={genreModalSearch}
              onChange={(event) => setGenreModalSearch(event.target.value)}
              disabled={genresQuery.isLoading || genresQuery.isError}
            />

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {genresQuery.isLoading ? (
                <p className="p-3 text-sm text-slate-500 dark:text-slate-300">Chargement...</p>
              ) : filteredGenres.length ? (
                filteredGenres.map((genre) => {
                  const isSelected = genreModalSelection.includes(genre.name)
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenreSelection(genre.name)}
                      className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
                        isSelected
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'text-slate-600 hover:bg-primary/10 dark:text-slate-200 dark:hover:bg-primary/20'
                      }`}
                    >
                      <span>{genre.name}</span>
                      {isSelected ? <span className="text-xs">Sélectionné</span> : null}
                    </button>
                  )
                })
              ) : (
                <p className="p-3 text-sm text-slate-500 dark:text-slate-300">
                  Aucun genre ne correspond à votre recherche.
                </p>
              )}
            </div>

            {genreModalSelection.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genreModalSelection.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {genre}
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={() => toggleGenreSelection(genre)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={closeGenreModal}>
                Annuler
              </button>
              <button type="button" className="btn" onClick={confirmGenreSelection}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default BookProposalForm
