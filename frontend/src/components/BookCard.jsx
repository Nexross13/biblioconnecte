import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { addBookToLibrary, removeBookFromLibrary } from '../api/library'
import { addBookToWishlist, removeBookFromWishlist } from '../api/wishlist'
import useAuth from '../hooks/useAuth'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const getAuthorList = (book) => {
  if (Array.isArray(book.authors) && book.authors.length) {
    return book.authors
      .map((author) => [author.firstName, author.lastName].filter(Boolean).join(' ').trim())
      .filter((value) => Boolean(value && value !== '0'))
  }
  if (Array.isArray(book.authorNames) && book.authorNames.length) {
    return book.authorNames.filter((value) => Boolean(value && value !== '0'))
  }
  return []
}

const getGenreList = (book) => {
  if (Array.isArray(book.genres) && book.genres.length) {
    return book.genres.map((genre) => genre.name).filter((value) => Boolean(value && value !== '0'))
  }
  if (Array.isArray(book.genreNames) && book.genreNames.length) {
    return book.genreNames.filter((value) => Boolean(value && value !== '0'))
  }
  return []
}

const BookCard = ({ book, inLibrary = false, inWishlist = false }) => {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const coverCandidates = useMemo(() => {
    if (!book?.isbn) {
      return []
    }
    return COVER_EXTENSIONS.map((ext) => `${ASSETS_BOOKS_BASE_URL}/${book.isbn}.${ext}`)
  }, [book?.isbn])

  const [coverSrc, setCoverSrc] = useState(() => coverCandidates[0] || PLACEHOLDER_COVER)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const authorNames = useMemo(() => getAuthorList(book), [book])
  const genreNames = useMemo(() => getGenreList(book), [book])

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
    mutationFn: ({ action, bookId }) =>
      action === 'add' ? addBookToLibrary(bookId) : removeBookFromLibrary(bookId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      if (variables.action === 'add') {
        queryClient.invalidateQueries({ queryKey: ['wishlist'] })
        queryClient.setQueryData(['wishlist'], (previous) =>
          Array.isArray(previous) ? previous.filter((item) => item.id !== variables.bookId) : previous,
        )
      }
      toast.success(
        variables.action === 'add'
          ? 'Livre ajouté à votre bibliothèque (retiré de vos souhaits)'
          : 'Livre retiré de votre bibliothèque',
      )
    },
    onError: () => toast.error("Impossible de mettre à jour la bibliothèque"),
  })

  const wishlistMutation = useMutation({
    mutationFn: ({ action, bookId }) =>
      action === 'add' ? addBookToWishlist(bookId) : removeBookFromWishlist(bookId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['library'] })
      toast.success(
        variables.action === 'add'
          ? 'Livre ajouté à la wishlist'
          : 'Livre retiré de la wishlist',
      )
    },
    onError: () => toast.error("Impossible de mettre à jour la wishlist"),
  })

  const handleLibrary = () => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour gérer votre bibliothèque')
      return
    }
    libraryMutation.mutate({
      action: inLibrary ? 'remove' : 'add',
      bookId: book.id,
    })
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour gérer votre wishlist')
      return
    }
    wishlistMutation.mutate({
      action: inWishlist ? 'remove' : 'add',
      bookId: book.id,
    })
  }

  const averageRating =
    book.averageRating !== null && book.averageRating !== undefined
      ? Number(book.averageRating)
      : null
  const reviewCount =
    typeof book.reviewCount === 'number' && !Number.isNaN(book.reviewCount)
      ? book.reviewCount
      : 0

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
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
          loading="lazy"
          className="h-48 w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-primary">{book.title}</h3>
          {averageRating !== null && !Number.isNaN(averageRating) && reviewCount > 0 && (
            <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900">
              ⭐ {averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-3">{book.summary}</p>
      </div>

      {authorNames.length > 0 || genreNames.length > 0 ? (
        <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-300">
          {authorNames.length > 0 ? (
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-200">Auteur(s) :</span>{' '}
              {authorNames.join(', ')}
            </p>
          ) : null}
          {genreNames.length > 0 ? (
            <p>
              <span className="font-semibold text-slate-600 dark:text-slate-200">Genres :</span>{' '}
              {genreNames.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        <Link to={`/books/${book.id}`} className="btn w-full text-center">
          Voir les détails
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLibrary}
            className={clsx(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
              inLibrary
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
            )}
            disabled={libraryMutation.isPending}
          >
            {libraryMutation.isPending
              ? 'En cours...'
              : inLibrary
              ? 'Retirer de ma bibliothèque'
              : 'Ajouter à ma bibliothèque'}
          </button>
          {!inLibrary && (
            <button
              type="button"
              onClick={handleWishlist}
              className={clsx(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                inWishlist
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
              )}
              disabled={wishlistMutation.isPending}
            >
              {wishlistMutation.isPending
                ? 'En cours...'
                : inWishlist
                ? 'Retirer de mes souhaits'
                : 'Ajouter à mes souhaits'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default BookCard
