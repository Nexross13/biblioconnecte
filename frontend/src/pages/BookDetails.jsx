import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  ArrowPathIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  FlagIcon,
  HeartIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
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
import formatBookTitle from '../utils/formatBookTitle'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'
import { reportBook } from '../api/bookReports'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const BrokenHeartIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.5 6.5l-2 3 3 2-2 4.5 3 2.5"
    />
  </svg>
)

const BookDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(null)
  const [comment, setComment] = useState('')
  const [isReportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const isAdmin = user?.role === 'admin'

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

  const reportMutation = useMutation({
    mutationFn: (payload) => reportBook(Number(id), payload),
    onSuccess: () => {
      toast.success('Signalement envoyé aux administrateurs')
      setReportModalOpen(false)
      setReportReason('')
    },
    onError: () => toast.error("Impossible d'envoyer votre signalement"),
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
  const displayTitle = formatBookTitle(book)

  const inLibrary = libraryQuery.data?.some((item) => item.id === book.id) ?? false
  const inWishlist = wishlistQuery.data?.some((item) => item.id === book.id) ?? false
  const libraryButtonLabel = libraryMutation.isPending
    ? 'Mise à jour...'
    : inLibrary
    ? 'Retirer de ma bibliothèque'
    : 'Ajouter à ma bibliothèque'
  const wishlistButtonLabel = wishlistMutation.isPending
    ? 'Mise à jour...'
    : inWishlist
    ? 'Retirer de ma wishlist'
    : 'Ajouter à ma wishlist'
  const reportButtonLabel = reportMutation.isPending
    ? 'Envoi du signalement...'
    : 'Signaler ce livre'
  const LibraryIcon = libraryMutation.isPending
    ? ArrowPathIcon
    : inLibrary
    ? BookmarkSlashIcon
    : BookmarkIcon
  const WishlistIcon =
    wishlistMutation.isPending ? ArrowPathIcon : inWishlist ? BrokenHeartIcon : HeartIcon
  const ReportIcon = reportMutation.isPending ? ArrowPathIcon : FlagIcon

  const authorEntries = Array.isArray(book.authors) && book.authors.length
    ? book.authors
        .map((author) => ({
          id: author.id,
          name:
            [author.firstName, author.lastName].filter(Boolean).join(' ').trim() ||
            author.email ||
            '',
        }))
        .filter((entry) => entry.name.length)
    : Array.isArray(book.authorNames) && book.authorNames.length
    ? book.authorNames
        .filter(Boolean)
        .map((name) => ({ id: null, name: String(name).trim() }))
        .filter((entry) => entry.name.length)
    : []
  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour réaliser cette action')
      return false
    }
    return true
  }

  const openReportModal = () => {
    if (!ensureAuthenticated()) {
      return
    }
    setReportReason('')
    setReportModalOpen(true)
  }

  const closeReportModal = () => {
    setReportModalOpen(false)
    setReportReason('')
  }

  const handleReportSubmit = (event) => {
    event.preventDefault()
    const reason = reportReason.trim()
    if (reason.length < 5) {
      toast.error('Merci de détailler votre motif (5 caractères minimum)')
      return
    }
    reportMutation.mutate({ reason })
  }

  return (
    <>
      <section className="space-y-8">
      <header className="card space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:flex-1 md:items-start">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800 md:w-64">
              <img
                src={coverSrc}
                alt={`Couverture de ${displayTitle || 'livre'}`}
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
              <h1 className="text-3xl font-bold text-primary">{displayTitle}</h1>

              <dl className="grid gap-3 text-xs text-slate-500 dark:text-slate-300 md:grid-cols-3 lg:grid-cols-4">
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
                {(book.volume || book.volumeTitle) && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Tome
                    </dt>
                    <dd>
                      {[book.volume ? `Tome ${book.volume}` : null, book.volumeTitle]
                        .filter(Boolean)
                        .join(' — ')}
                    </dd>
                  </div>
                )}
                {authorEntries.length > 0 && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Auteur(s)
                    </dt>
                    <dd className="mt-1 space-y-1">
                      {authorEntries.map((entry, index) => (
                        <div key={entry.id ?? `${entry.name}-${index}`}>
                          {entry.id ? (
                            <Link className="text-primary hover:underline" to={`/authors/${entry.id}`}>
                              {entry.name}
                            </Link>
                          ) : (
                            entry.name
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
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
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Note moyenne : {averageRating.toFixed(1)} ⭐
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:flex-col sm:items-stretch sm:gap-3">
            <button
              type="button"
              className={`btn inline-flex items-center justify-center ${inLibrary ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
              onClick={() =>
                ensureAuthenticated() &&
                libraryMutation.mutate({
                  action: inLibrary ? 'remove' : 'add',
                })
              }
              disabled={libraryMutation.isPending}
              aria-label={libraryButtonLabel}
              title={libraryButtonLabel}
            >
              <LibraryIcon
                className={`h-6 w-6 ${libraryMutation.isPending ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="sr-only">{libraryButtonLabel}</span>
            </button>
            {!inLibrary && (
              <button
                type="button"
                className={`btn-secondary inline-flex items-center justify-center ${inWishlist ? 'bg-rose-500 text-white hover:bg-rose-600' : ''}`}
                onClick={() =>
                  ensureAuthenticated() &&
                  wishlistMutation.mutate({
                    action: inWishlist ? 'remove' : 'add',
                  })
                }
                disabled={wishlistMutation.isPending}
                aria-label={wishlistButtonLabel}
                title={wishlistButtonLabel}
              >
                <WishlistIcon
                  className={`h-6 w-6 ${wishlistMutation.isPending ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span className="sr-only">{wishlistButtonLabel}</span>
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
              onClick={openReportModal}
              disabled={reportMutation.isPending}
              aria-label={reportButtonLabel}
              title={reportButtonLabel}
            >
              <ReportIcon
                className={`h-6 w-6 ${reportMutation.isPending ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="sr-only">{reportButtonLabel}</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                onClick={() => navigate(`/books/${id}/edit`)}
                aria-label="Modifier les informations"
                title="Modifier les informations"
              >
                <PencilSquareIcon className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Modifier les informations</span>
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
      {isReportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-book-title"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="report-book-title" className="text-lg font-semibold text-primary">
                Signaler ce livre
              </h3>
              <button
                type="button"
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Fermer"
                onClick={closeReportModal}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Expliquez brièvement ce qui pose problème afin que l’équipe puisse intervenir rapidement.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleReportSubmit}>
              <div className="space-y-2">
                <label htmlFor="book-report-reason" className="text-sm font-medium text-slate-600 dark:text-slate-200">
                  Motif du signalement
                </label>
                <textarea
                  id="book-report-reason"
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Contenu inapproprié, informations fausses, etc."
                  maxLength={1000}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  disabled={reportMutation.isPending}
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  5 à 1000 caractères • Ce message sera partagé avec l’équipe.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={closeReportModal}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn disabled:opacity-60"
                  disabled={reportMutation.isPending || reportReason.trim().length < 5}
                >
                  {reportMutation.isPending ? 'Envoi...' : 'Confirmer l’envoi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default BookDetails
