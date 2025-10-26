import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
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

const BookDetails = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
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
  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour réaliser cette action')
      return false
    }
    return true
  }

  return (
    <section className="space-y-8">
      <header className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">{book.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">{book.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
              {book.authors?.map((author) => (
                <span
                  key={author.id}
                  className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700"
                >
                  {author.firstName} {author.lastName}
                </span>
              ))}
              {book.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-primary/10 px-3 py-1 text-primary dark:bg-primary/20"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
          {averageRating && (
            <div className="rounded-2xl bg-amber-400/80 px-4 py-3 text-center text-amber-900 shadow">
              <p className="text-xs uppercase tracking-wide">Note moyenne</p>
              <p className="text-2xl font-bold">⭐ {averageRating.toFixed(1)}</p>
            </div>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            className="btn"
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
          <button
            type="button"
            className="btn-secondary"
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
        </div>
        <dl className="grid gap-3 text-xs text-slate-500 dark:text-slate-300 md:grid-cols-3">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              ISBN
            </dt>
            <dd>{book.isbn || 'Inconnu'}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Edition
            </dt>
            <dd>{book.edition || 'Inconnue'}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Ajouté le
            </dt>
            <dd>{formatDate(book.createdAt)}</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">Avis des lecteurs</h2>
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
      </section>

      {isAuthenticated && (
        <section className="card space-y-4">
          <h3 className="text-lg font-semibold text-primary">Ajouter un avis</h3>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Note (1 à 5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="input"
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Commentaire
                </label>
                <textarea
                  className="input min-h-[100px]"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Partagez votre ressenti..."
                />
              </div>
            </div>
            <button type="submit" className="btn" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? 'Envoi...' : 'Publier mon avis'}
            </button>
          </form>
        </section>
      )}
    </section>
  )
}

export default BookDetails
