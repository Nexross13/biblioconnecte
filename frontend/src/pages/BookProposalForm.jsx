import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { createBookProposal } from '../api/bookProposals'
import { fetchGenres } from '../api/genres'
import { fetchAuthors } from '../api/authors'
import { fetchBooks, fetchBookSeriesPrefill } from '../api/books'
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
  volumeTitle: '',
  releaseDate: '',
  summary: '',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const SUMMARY_MAX_LENGTH = 2000
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
  const [authorSearchTerm, setAuthorSearchTerm] = useState('')
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false)
  const [genres, setGenres] = useState([])
  const [genreSearchTerm, setGenreSearchTerm] = useState('')
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false)
  const [coverImageData, setCoverImageData] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const [coverError, setCoverError] = useState('')
  const [titleSearchTerm, setTitleSearchTerm] = useState('')
  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState('')
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false)
  const [hasPrefillFromSuggestion, setHasPrefillFromSuggestion] = useState(false)
  const titleFieldRef = useRef(null)
  const authorFieldRef = useRef(null)
  const genreFieldRef = useRef(null)

  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  })

  const authorsQuery = useQuery({
    queryKey: ['authors'],
    queryFn: fetchAuthors,
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTitleSearch(titleSearchTerm.trim())
    }, 250)
    return () => clearTimeout(handler)
  }, [titleSearchTerm])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (titleFieldRef.current && !titleFieldRef.current.contains(event.target)) {
        setIsTitleDropdownOpen(false)
      }
      if (authorFieldRef.current && !authorFieldRef.current.contains(event.target)) {
        setIsAuthorDropdownOpen(false)
      }
      if (genreFieldRef.current && !genreFieldRef.current.contains(event.target)) {
        setIsGenreDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const titleSuggestionsQuery = useQuery({
    queryKey: ['book-title-suggestions', debouncedTitleSearch],
    queryFn: async () => {
      const data = await fetchBooks({ search: debouncedTitleSearch, limit: 5 })
      return data.books ?? []
    },
    enabled: debouncedTitleSearch.length >= 2,
  })

  const filteredGenres = useMemo(() => {
    const availableGenres = genresQuery.data ?? []
    const lower = genreSearchTerm.trim().toLowerCase()
    if (!lower.length) {
      return availableGenres.slice(0, 6)
    }
    return availableGenres
      .filter((genre) => genre.name.toLowerCase().includes(lower))
      .slice(0, 6)
  }, [genresQuery.data, genreSearchTerm])

  const filteredAuthors = useMemo(() => {
    const availableAuthors = authorsQuery.data ?? []
    const lower = authorSearchTerm.trim().toLowerCase()
    if (!lower.length) {
      return availableAuthors.slice(0, 6)
    }
    return availableAuthors
      .filter((author) => getAuthorDisplayName(author).toLowerCase().includes(lower))
      .slice(0, 6)
  }, [authorsQuery.data, authorSearchTerm])

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getSeriesDisplayTitle = (book) => {
    const baseTitle = (book?.title || '').trim()
    const volumeTitle = (book?.volumeTitle || '').trim()
    if (baseTitle && volumeTitle) {
      const pattern = new RegExp(`\\s*[-–—]\\s*${escapeRegExp(volumeTitle)}$`, 'i')
      if (pattern.test(baseTitle)) {
        return baseTitle.replace(pattern, '').trim()
      }
    }
    return baseTitle || volumeTitle || ''
  }

  const titleSuggestions = useMemo(() => {
    if (!Array.isArray(titleSuggestionsQuery.data)) {
      return []
    }
    const seen = new Set()
    return titleSuggestionsQuery.data.filter((book) => {
      const normalized = (book.title || '').trim().toLowerCase()
      if (!normalized || seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
  }, [titleSuggestionsQuery.data])

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
      if (draft.formValues.title) {
        setTitleSearchTerm(draft.formValues.title)
      }
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
      setTitleSearchTerm(prefilledTitle)
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
      setGenres([])
      setCoverImageData(null)
      setCoverPreviewUrl(null)
      setCoverError('')
      setTitleSearchTerm('')
      setAuthorSearchTerm('')
      setGenreSearchTerm('')
      setHasPrefillFromSuggestion(false)
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
    if (name === 'title') {
      setTitleSearchTerm(value)
      setIsTitleDropdownOpen(true)
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const addAuthor = (name) => {
    const normalized = name.trim()
    if (!normalized || authors.includes(normalized)) {
      return
    }
    setAuthors((prev) => [...prev, normalized])
    setAuthorSearchTerm('')
    setIsAuthorDropdownOpen(false)
    if (errors.authorNames) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.authorNames
        return next
      })
    }
  }

  const addGenre = (name) => {
    const normalized = name.trim()
    if (!normalized || genres.includes(normalized)) {
      return
    }
    setGenres((prev) => [...prev, normalized])
    setGenreSearchTerm('')
    setIsGenreDropdownOpen(false)
    if (errors.genreNames) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.genreNames
        return next
      })
    }
  }

  const handleAuthorRemove = (name) => {
    setAuthors((prev) => prev.filter((value) => value !== name))
  }

  const handleGenreRemove = (name) => {
    setGenres((prev) => prev.filter((value) => value !== name))
  }

  const handleAuthorInputKeyDown = (event) => {
    if (event.key === 'Enter' && authorSearchTerm.trim()) {
      event.preventDefault()
      addAuthor(authorSearchTerm)
    }
  }

  const handleGenreInputKeyDown = (event) => {
    if (event.key === 'Enter' && genreSearchTerm.trim()) {
      event.preventDefault()
      addGenre(genreSearchTerm)
    }
  }

  const handleTitleSuggestionSelect = async (book) => {
    const nextTitle = book.title || ''
    setTitleSearchTerm(nextTitle)
    setIsTitleDropdownOpen(false)
    setFormValues((prev) => ({
      ...prev,
      title: nextTitle,
      edition: book.edition ?? prev.edition,
    }))
    try {
      const prefill = await fetchBookSeriesPrefill(book.id)
      setFormValues((prev) => ({
        ...prev,
        title: nextTitle || prev.title,
        edition: prefill?.edition ?? book.edition ?? prev.edition,
        volume: prefill?.nextVolume ?? prev.volume,
      }))
      if (prefill?.genreNames?.length) {
        setGenres(prefill.genreNames)
        if (errors.genreNames) {
          setErrors((prev) => {
            const next = { ...prev }
            delete next.genreNames
            return next
          })
        }
      }
    } catch {
      toast.error("Impossible de récupérer les informations de la série.")
    }
    setHasPrefillFromSuggestion(true)
  }

  const handleAuthorSuggestionSelect = (author) => {
    addAuthor(getAuthorDisplayName(author))
  }

  const handleGenreSuggestionSelect = (genreName) => {
    addGenre(genreName)
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
      volumeTitle: formValues.volumeTitle.trim() || null,
      releaseDate: formValues.releaseDate.trim() || null,
      summary: formValues.summary.trim() || null,
      authorNames: authors,
      genreNames: genres,
      coverImage: coverImageData,
    }

    mutation.mutate(payload)
  }

  const resetFormForNewSeries = useCallback(
    (nextTitle) => {
      setFormValues({
        ...initialState,
        title: nextTitle,
      })
      setErrors({})
      setAuthors([])
      setAuthorSearchTerm('')
      setIsAuthorDropdownOpen(false)
      setGenres([])
      setGenreSearchTerm('')
      setIsGenreDropdownOpen(false)
      setCoverImageData(null)
      setCoverPreviewUrl(null)
      setCoverError('')
      setTitleSearchTerm(nextTitle)
    },
    [],
  )

  useEffect(() => {
    if (!hasPrefillFromSuggestion) {
      return
    }
    if (titleSearchTerm.trim().length < 2) {
      return
    }
    if (titleSuggestionsQuery.isLoading) {
      return
    }
    if (titleSuggestions.length > 0) {
      return
    }
    const currentTitle = formValues.title.trim()
    if (!currentTitle.length) {
      return
    }
    resetFormForNewSeries(currentTitle)
    setHasPrefillFromSuggestion(false)
  }, [
    hasPrefillFromSuggestion,
    titleSearchTerm,
    titleSuggestionsQuery.isLoading,
    titleSuggestions.length,
    formValues.title,
    resetFormForNewSeries,
  ])

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
        <div className="space-y-2" ref={titleFieldRef}>
          <label htmlFor="title" className="text-sm font-semibold text-primary">
            <span className="text-rose-500" aria-hidden="true">
              *
            </span>{' '}
            Titre
          </label>
          <div className="relative">
            <input
              id="title"
              name="title"
              type="text"
              className="input"
              placeholder="Ex. La Horde du Contrevent"
              value={formValues.title}
              onChange={handleChange}
              onFocus={() => {
                if (titleSearchTerm.trim().length >= 2) {
                  setIsTitleDropdownOpen(true)
                }
              }}
              autoComplete="off"
              required
            />
            {isTitleDropdownOpen && titleSearchTerm.trim().length >= 2 && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {titleSuggestionsQuery.isLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">Recherche...</p>
                ) : titleSuggestionsQuery.isError ? (
                  <p className="px-4 py-3 text-sm text-rose-600">Erreur lors de la recherche</p>
                ) : titleSuggestions.length ? (
                  titleSuggestions.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleTitleSuggestionSelect(book)}
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-100">
                        {getSeriesDisplayTitle(book) || 'Titre inconnu'}
                      </span>
                      {book.edition && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{book.edition}</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                    Aucun résultat pour « {titleSearchTerm.trim()} »
                  </p>
                )}
              </div>
            )}
          </div>
          {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="isbn" className="text-sm font-semibold text-primary">
              <span className="text-rose-500" aria-hidden="true">
                *
              </span>{' '}
              ISBN/EAN
            </label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              className="input"
              placeholder="ISBN ou EAN"
              value={formValues.isbn}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edition" className="text-sm font-semibold text-primary">
              <span className="text-rose-500" aria-hidden="true">
                *
              </span>{' '}
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

        <div className="grid gap-4 md:grid-cols-3">
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
            <label htmlFor="volumeTitle" className="text-sm font-semibold text-primary">
              Titre du tome
            </label>
            <input
              id="volumeTitle"
              name="volumeTitle"
              type="text"
              className="input h-10"
              placeholder="Ex. La Communauté de l’Anneau"
              value={formValues.volumeTitle}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="releaseDate" className="text-sm font-semibold text-primary">
              <span className="text-rose-500" aria-hidden="true">
                *
              </span>{' '}
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
            maxLength={SUMMARY_MAX_LENGTH}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formValues.summary.length}/{SUMMARY_MAX_LENGTH} caractères
          </p>
        </div>

        <div className="space-y-2" ref={authorFieldRef}>
          <span className="text-sm font-semibold text-primary">
            <span className="text-rose-500" aria-hidden="true">
              *
            </span>{' '}
            Auteur(s)
          </span>
          <div className="relative">
            <input
              type="text"
              className="input"
              placeholder="Recherchez un auteur existant ou ajoutez-en un nouveau"
              value={authorSearchTerm}
              onChange={(event) => {
                setAuthorSearchTerm(event.target.value)
                setIsAuthorDropdownOpen(true)
              }}
              onFocus={() => setIsAuthorDropdownOpen(true)}
              onKeyDown={handleAuthorInputKeyDown}
              disabled={authorsQuery.isLoading || authorsQuery.isError}
            />
            {isAuthorDropdownOpen && authorSearchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {authorsQuery.isLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">Chargement...</p>
                ) : authorsQuery.isError ? (
                  <p className="px-4 py-3 text-sm text-rose-600">Impossible de charger les auteurs.</p>
                ) : filteredAuthors.length ? (
                  filteredAuthors.map((author) => {
                    const displayName = getAuthorDisplayName(author)
                    return (
                      <button
                        key={author.id}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => handleAuthorSuggestionSelect(author)}
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-100">{displayName}</span>
                        {author.email && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">{author.email}</span>
                        )}
                      </button>
                    )
                  })
                ) : authorSearchTerm.trim() ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                    Aucun auteur ne correspond à « {authorSearchTerm.trim()} ».{' '}
                    <Link
                      to="/authors/new"
                      className="font-semibold text-primary hover:underline"
                    >
                      Ajouter un nouvel auteur
                    </Link>
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                    Commencez à taper pour rechercher un auteur.
                  </p>
                )}
              </div>
            )}
          </div>
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

        <div className="space-y-2" ref={genreFieldRef}>
          <span className="text-sm font-semibold text-primary">
            <span className="text-rose-500" aria-hidden="true">
              *
            </span>{' '}
            Genre(s)
          </span>
          <div className="relative">
            <input
              type="text"
              className="input"
              placeholder="Recherchez un genre"
              value={genreSearchTerm}
              onChange={(event) => {
                setGenreSearchTerm(event.target.value)
                setIsGenreDropdownOpen(true)
              }}
              onFocus={() => setIsGenreDropdownOpen(true)}
              onKeyDown={handleGenreInputKeyDown}
              disabled={genresQuery.isLoading || genresQuery.isError}
            />
            {isGenreDropdownOpen && genreSearchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {genresQuery.isLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">Chargement...</p>
                ) : genresQuery.isError ? (
                  <p className="px-4 py-3 text-sm text-rose-600">Impossible de charger les genres.</p>
                ) : filteredGenres.length ? (
                  filteredGenres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleGenreSuggestionSelect(genre.name)}
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-100">{genre.name}</span>
                    </button>
                  ))
                ) : genreSearchTerm.trim() ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => addGenre(genreSearchTerm)}
                  >
                    Ajouter « {genreSearchTerm.trim()} »
                  </button>
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                    Commencez à taper pour rechercher un genre.
                  </p>
                )}
              </div>
            )}
          </div>
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
              setGenres([])
              setAuthorSearchTerm('')
              setGenreSearchTerm('')
              setCoverImageData(null)
              setCoverPreviewUrl(null)
              setCoverError('')
              setTitleSearchTerm(prefilledTitle || '')
              clearDraft()
            }}
          >
            Réinitialiser le formulaire
          </button>
          <p className="text-right text-xs text-rose-500 dark:text-rose-400 md:ml-auto">* Champs obligatoires</p>
        </div>
      </form>
    </section>
  )
}

export default BookProposalForm
