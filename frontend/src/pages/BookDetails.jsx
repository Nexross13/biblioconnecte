import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  fetchBookById,
  fetchBookReviews,
  createBookReview,
  fetchBookAuthors,
  fetchBookGenres,
} from '../api/books'
import { addBookToLibrary, removeBookFromLibrary, fetchLibrary } from '../api/library'
import { addBookToWishlist, removeBookFromWishlist, fetchWishlist } from '../api/wishlist'
import Loader from '../components/Loader.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'
import getAverageRating from '../utils/getAverageRating'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const BookDetails = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(null)
  const [comment, setComment] = useState('')

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBookById(id),
  })

  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
    enabled: isAuthenticated,
  })

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  })

  const reviewsQuery = useQuery({
    queryKey: ['bookReviews', id],
    queryFn: () => fetchBookReviews(id),
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

  const coverCandidates = useMemo(() => {
    const isbn = bookQuery.data?.isbn
    if (!isbn) {
      return []
    }
    return COVER_EXTENSIONS.map((ext) => `${ASSETS_BOOKS_BASE_URL}/${isbn}.${ext}`)
  }, [bookQuery.data?.isbn])

  const [coverSrc, setCoverSrc] = useState(() => coverCandidates[0] || PLACEHOLDER_COVER)
  const [candidateIndex, setCandidateIndex] = useState(0)

  useEffect(() => {
    if (!coverCandidates.length) {
      setCoverSrc(PLACEHOLDER_COVER)
      setCandidateIndex(0)
      return
    }
    setCoverSrc(coverCandidates[0])
    setCandidateIndex(0)
  }, [coverCandidates])

  const libraryMutation = useMutation({
    mutationFn: ({ action }) =>
      action === 'add' ? addBookToLibrary(Number(id)) : removeBookFromLibrary(Number(id)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      toast.success(
        variables.action === 'add'
          ? 'Livre ajouté à votre bibliothèque'
          : 'Livre retiré de votre bibliothèque',
      )
    },
  })

  const wishlistMutation = useMutation({
    mutationFn: ({ action }) =>
      action === 'add'
        ? addBookToWishlist(Number(id))
        : removeBookFromWishlist(Number(id)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(
        variables.action === 'add'
          ? 'Livre ajouté à votre wishlist'
          : 'Livre retiré de votre wishlist',
      )
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (payload) => createBookReview(Number(id), payload),
    onSuccess: () => {
      setRating(5)
      setComment('')
      toast.success('Avis publié !')
      queryClient.invalidateQueries({ queryKey: ['bookReviews', id] })
    },
    onError: () => toast.error("Impossible de publier l'avis"),
  })

  const averageRating = useMemo(
    () => getAverageRating(reviewsQuery.data || []),
    [reviewsQuery.data],
  )

  if (bookQuery.isLoading) {
    return <Loader label="Chargement du livre..." />
  }

  if (bookQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger ce livre. Veuillez réessayer plus tard.
      </p>
    )
  }

  const book = {
    ...bookQuery.data,
    authors: authorsQuery.data,
    genres: genresQuery.data,
  }

  const inLibrary = libraryQuery.data?.some((item) => item.id === book.id) ?? false
  const inWishlist = wishlistQuery.data?.some((item) => item.id === book.id) ?? false

  const authorEntries = useMemo(() => {
    if (Array.isArray(book.authors) && book.authors.length) {
      return book.authors
        .map((author) => ({
          id: author.id,
          name:
            [author.firstName, author.lastName].filter(Boolean).join(' ').trim() ||
            author.email ||
            '',
        }))
        .filter((entry) => entry.name.length)
    }
    if (Array.isArray(book.authorNames) && book.authorNames.length) {
      return book.authorNames
        .filter(Boolean)
        .map((name) => ({ id: null, name: String(name).trim() }))
        .filter((entry) => entry.name.length)
    }
    return []
  }, [book.authors, book.authorNames])

  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour réaliser cette action')
      return false
    }
    return true
  }

  return (
    <section className="space-y-8">
      <header className="card space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:flex-1">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800 md:w-64">
              <img
                src={coverSrc}
                alt={`Couverture de ${book.title}`}
                onError={(event) => {
                  if (candidateIndex < coverCandidates.length - 1) {
                    const nextIndex = candidateIndex + 1
                    setCandidateIndex(nextIndex)
                    setCoverSrc(coverCandidates[nextIndex])
                    return
                  }
                  event.currentTarget.src = PLACEHOLDER_COVER
                }}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-5">
              <h1 className="flex items-center gap-20 text-3xl font-bold text-primary">
                <span>{book.title}</span>
                {authorEntries.length > 0 && (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-200">
                    {authorEntries.map((entry, index) => (
                      <Fragment key={entry.id ?? `${entry.name}-${index}`}>
                        {entry.id ? (
                          <Link className="text-primary hover:underline" to={`/authors/${entry.id}`}>
                            {entry.name}
                          </Link>
                        ) : (
                          entry.name
                        )}
                        {index < authorEntries.length - 1 && ', '}
                      </Fragment>
                    ))}
                  </span>
                )}
              </h1>

              <dl className="grid gap-3 text-xs text-slate-500 dark:text-slate-300 md:grid-cols-3">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    ISBN
                  </dt>
                  <dd>{book.isbn || 'Inconnu'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Édition
                  </dt>
                  <dd>{book.edition || 'Inconnue'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Date de parution
                  </dt>
                  <dd>{book.releaseDate ? formatDate(book.releaseDate) : 'Inconnue'}</dd>
                </div>
              </dl>

              {book.summary && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Résumé
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{book.summary}</p>
                </div>
              )}

              {(book.genres?.length || book.genreNames?.length) && (
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
                  {book.genres?.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full bg-primary/10 px-3 py-1 text-primary dark:bg-primary/20"
                    >
                      {genre.name}
                    </span>
                  ))}
                  {book.genreNames?.map((name, index) => (
                    <span
                      key={`genre-name-${index}`}
                      className="rounded-full bg-primary/10 px-3 py-1 text-primary dark:bg-primary/20"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {averageRating && (
                <div className="rounded-2xl bg-amber-400/80 px-4 py-3 text-center text-amber-900 shadow">
                  <p className="text-xs uppercase tracking-wide">Note moyenne</p>
                  <p className="text-2xl font-bold">⭐ {averageRating.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 self-start">
            <button
              type="button"
              className={`btn ${inLibrary ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
              onClick={() =>
                ensureAuthenticated() &&
                libraryMutation.mutate({
                  action: inLibrary ? 'remove' : 'add',
                })
              }
              disabled={libraryMutation.isPending}
            >
              {libraryMutation.isPending
                ? 'Mise à jour...'
                : inLibrary
                ? 'Retirer de ma bibliothèque'
                : 'Ajouter à ma bibliothèque'}
            </button>
            {!inLibrary && (
              <button
                type="button"
                className={`btn-secondary ${inWishlist ? 'bg-rose-500 text-white hover:bg-rose-600' : ''}`}
                onClick={() =>
                  ensureAuthenticated() &&
                  wishlistMutation.mutate({
                    action: inWishlist ? 'remove' : 'add',
                  })
                }
                disabled={wishlistMutation.isPending}
              >
                {wishlistMutation.isPending
                  ? 'Mise à jour...'
                  : inWishlist
                  ? 'Retirer de ma wishlist'
                  : 'Ajouter à ma wishlist'}
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary">Avis des lecteurs</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-primary">Ajouter un avis</h3>
            {isAuthenticated ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                    toast.error('La note doit être comprise entre 1 et 5')
                    return
                  }
                  reviewMutation.mutate({ rating, comment })
                }}
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Note (1 à 5)
                    </label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, index) => {
                        const value = index + 1
                        const isActive = (hoverRating ?? rating) >= value
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`text-2xl transition ${
                              isActive ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                            onMouseEnter={() => setHoverRating(value)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(value)}
                            aria-label={`Attribuer la note de ${value} sur 5`}
                          >
                            {isActive ? '★' : '☆'}
                          </button>
                        )
                      })}
                    </div>
                    <input type="hidden" name="rating" value={rating} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Commentaire
                    </label>
                    <textarea
                      className="input min-h-[120px]"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Partagez votre ressenti..."
                    />
                  </div>
                </div>
                <button type="submit" className="btn w-full" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Connectez-vous pour laisser un avis sur ce livre.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {reviewsQuery.isLoading ? (
              <Loader label="Chargement des avis..." />
            ) : reviewsQuery.data?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {reviewsQuery.data.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aucun avis pour le moment. Soyez le premier à partager votre ressenti.
              </p>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}

export default BookDetails
