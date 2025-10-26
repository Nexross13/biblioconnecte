import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { addBookToLibrary, removeBookFromLibrary } from '../api/library'
import { addBookToWishlist, removeBookFromWishlist } from '../api/wishlist'
import useAuth from '../hooks/useAuth'

const BookCard = ({ book, inLibrary = false, inWishlist = false }) => {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const libraryMutation = useMutation({
    mutationFn: ({ action, bookId }) =>
      action === 'add' ? addBookToLibrary(bookId) : removeBookFromLibrary(bookId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      toast.success(
        variables.action === 'add'
          ? 'Livre ajouté à votre bibliothèque'
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

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-primary">{book.title}</h3>
          {book.averageRating && (
            <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900">
              ⭐ {book.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-3">{book.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
        {book.authors?.map((author) => (
          <span key={author.id} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700">
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
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
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
        </div>
      </div>
    </article>
  )
}

export default BookCard
