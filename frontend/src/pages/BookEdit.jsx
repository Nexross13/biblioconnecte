import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Loader from '../components/Loader.jsx'
import {
  fetchBookById,
  fetchBookAuthors,
  fetchBookGenres,
  updateBook,
} from '../api/books'
import { BookMetadataForm } from './BookProposalForm.jsx'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'

const formatAuthorLabel = (author) => {
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ').trim()
  return name || author.email || `Auteur ${author.id}`
}

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const normalizeCoverPath = (path) => {
  if (!path) {
    return null
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  return path.startsWith('/') ? path : `/${path}`
}

const BookEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBookById(id),
  })

  const [authorsQuery, genresQuery] = useQueries({
    queries: [
      {
        queryKey: ['bookAuthors', id],
        queryFn: () => fetchBookAuthors(id),
      },
      {
        queryKey: ['bookGenres', id],
        queryFn: () => fetchBookGenres(id),
      },
    ],
  })

  const updateBookMutation = useMutation({
    mutationFn: (payload) => {
      const sanitizedPayload = {
        title: payload.title,
        isbn: payload.isbn,
        edition: payload.edition,
        volume: payload.volume,
        volumeTitle: payload.volumeTitle,
        releaseDate: payload.releaseDate,
        summary: payload.summary,
      }
      if (Array.isArray(payload.authorIds)) {
        sanitizedPayload.authorIds = payload.authorIds
      }
      if (Array.isArray(payload.genreIds)) {
        sanitizedPayload.genreIds = payload.genreIds
      }
      return updateBook(Number(id), sanitizedPayload)
    },
    onSuccess: () => {
      toast.success('Livre mis à jour')
      queryClient.invalidateQueries({ queryKey: ['book', id] })
      queryClient.invalidateQueries({ queryKey: ['bookAuthors', id] })
      queryClient.invalidateQueries({ queryKey: ['bookGenres', id] })
      navigate(`/books/${id}`)
    },
    onError: () => toast.error('Impossible de mettre à jour le livre'),
  })

  const isLoading =
    bookQuery.isLoading || authorsQuery.isLoading || genresQuery.isLoading

  if (isLoading) {
    return <Loader label="Chargement du livre..." />
  }

  if (bookQuery.isError || authorsQuery.isError || genresQuery.isError) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm text-rose-600">
          Impossible de charger ce livre ou ses métadonnées. Veuillez réessayer plus tard.
        </p>
      </section>
    )
  }

  const book = {
    ...bookQuery.data,
    authors: authorsQuery.data,
    genres: genresQuery.data,
  }

  const normalizedCoverPath = useMemo(() => {
    const normalized = normalizeCoverPath(book.coverImagePath)
    if (normalized === PLACEHOLDER_COVER) {
      return null
    }
    return normalized
  }, [book.coverImagePath])

  const coverCandidates = useMemo(() => {
    const candidates = []
    if (normalizedCoverPath) {
      candidates.push(normalizedCoverPath)
    }
    if (book.isbn) {
      candidates.push(
        ...COVER_EXTENSIONS.map((ext) => `${ASSETS_BOOKS_BASE_URL}/${book.isbn}.${ext}`),
      )
    }
    return candidates
  }, [normalizedCoverPath, book.isbn])

  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    let cancelled = false
    let activeImage = null
    if (!coverCandidates.length) {
      setCoverPreviewUrl(null)
      return undefined
    }
    const tryLoad = (index) => {
      if (index >= coverCandidates.length) {
        if (!cancelled) {
          setCoverPreviewUrl(null)
        }
        return
      }
      activeImage = new window.Image()
      activeImage.onload = () => {
        if (!cancelled) {
          setCoverPreviewUrl(coverCandidates[index])
        }
      }
      activeImage.onerror = () => {
        if (!cancelled) {
          tryLoad(index + 1)
        }
      }
      activeImage.src = coverCandidates[index]
    }
    tryLoad(0)
    return () => {
      cancelled = true
      if (activeImage) {
        activeImage.onload = null
        activeImage.onerror = null
      }
    }
  }, [coverCandidates])

  const initialFormValues = useMemo(
    () => ({
      title: book.title || '',
      isbn: book.isbn || '',
      edition: book.edition || '',
      volume: book.volume || '',
      volumeTitle: book.volumeTitle || '',
      releaseDate: book.releaseDate ? book.releaseDate.slice(0, 10) : '',
      summary: book.summary || '',
    }),
    [book],
  )

  const initialAuthors = useMemo(() => {
    if (Array.isArray(book.authors) && book.authors.length) {
      return book.authors
        .map((author) => ({
          id: author.id ?? null,
          label: formatAuthorLabel(author),
        }))
        .filter((entry) => entry.label.trim().length)
    }
    if (Array.isArray(book.authorNames) && book.authorNames.length) {
      return book.authorNames
        .map((name) => {
          const label = String(name || '').trim()
          return label ? { id: null, label } : null
        })
        .filter(Boolean)
    }
    return []
  }, [book.authors, book.authorNames])

  const initialGenres = useMemo(() => {
    if (Array.isArray(book.genres) && book.genres.length) {
      return book.genres
        .map((genre) => ({
          id: genre.id ?? null,
          label: String(genre.name || '').trim(),
        }))
        .filter((entry) => entry.label.length)
    }
    if (Array.isArray(book.genreNames) && book.genreNames.length) {
      return book.genreNames
        .map((name) => {
          const label = String(name || '').trim()
          return label ? { id: null, label } : null
        })
        .filter(Boolean)
    }
    return []
  }, [book.genres, book.genreNames])

  return (
    <BookMetadataForm
      mode="edit"
      initialFormValues={initialFormValues}
      initialAuthors={initialAuthors}
      initialGenres={initialGenres}
      enableDraft={false}
      mutationOverride={updateBookMutation}
      submitLabel="Enregistrer les modifications"
      cancelLabel="Annuler"
      onCancel={() => navigate(-1)}
      prefilledTitle={initialFormValues.title}
      showResetButton={false}
      initialCoverUrl={coverPreviewUrl}
    />
  )
}

export default BookEdit
