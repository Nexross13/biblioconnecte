import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { approveReview, deleteReview } from '../api/reviews'
import formatDate from '../utils/formatDate'

const buildBookLabel = (book) => {
  if (!book) {
    return 'Livre inconnu'
  }
  if (book.volumeTitle) {
    return `${book.title} — ${book.volumeTitle}`
  }
  return book.title
}

const ModerationReviewCard = ({ review }) => {
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()
  const bookLabel = useMemo(() => buildBookLabel(review.book), [review.book])
  const reviewerName = [review.author?.firstName, review.author?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Lecteur anonyme'
  const moderatorName = [review.moderator?.firstName, review.moderator?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  const isApproved = review.moderationStatus === 'approved'

  const deleteMutation = useMutation({
    mutationFn: (payload) => deleteReview(review.id, payload),
    onSuccess: () => {
      toast.success('Avis supprimé')
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['moderation-feed'] })
      if (review.bookId) {
        queryClient.invalidateQueries({ queryKey: ['bookReviews', review.bookId] })
      }
    },
    onError: () => toast.error("Impossible de supprimer l'avis"),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveReview(review.id),
    onSuccess: () => {
      toast.success('Avis validé')
      queryClient.invalidateQueries({ queryKey: ['moderation-feed'] })
      if (review.bookId) {
        queryClient.invalidateQueries({ queryKey: ['bookReviews', review.bookId] })
      }
    },
    onError: () => toast.error("Impossible de valider l'avis"),
  })

  const reasonIsMissing = reason.trim().length === 0
  const reasonFieldId = `moderation-reason-${review.id}`

  const handleDelete = () => {
    if (reasonIsMissing) {
      toast.error('Merci de préciser un motif avant de supprimer')
      return
    }
    deleteMutation.mutate({ reason: reason.trim() })
  }

  return (
    <article className="card space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {review.book?.id ? (
            <Link
              to={`/books/${review.book.id}`}
              className="text-base font-semibold text-primary hover:underline"
            >
              {bookLabel}
            </Link>
          ) : (
            <p className="text-base font-semibold text-primary">{bookLabel}</p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Posté par <span className="font-medium">{reviewerName}</span> le{' '}
            {formatDate(review.createdAt)}
          </p>
          <p className={`text-xs font-semibold ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isApproved
              ? `Validé${moderatorName ? ` par ${moderatorName}` : ''}`
              : 'En attente de validation'}
          </p>
        </div>
        <span className="self-start rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900">
          ⭐ {review.rating}
        </span>
      </header>

      {review.comment ? (
        <p className="text-sm text-slate-700 dark:text-slate-200">{review.comment}</p>
      ) : (
        <p className="text-sm italic text-slate-500 dark:text-slate-400">
          Aucun commentaire fourni.
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor={reasonFieldId}
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300"
        >
          Motif du refus
        </label>
        <textarea
          id={reasonFieldId}
          name="reason"
          className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Précisez au lecteur pourquoi son avis est supprimé..."
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={deleteMutation.isPending}
          required
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Le motif est obligatoire uniquement pour une suppression.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        {!isApproved && (
          <button
            type="button"
            className="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:border-emerald-600 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Validation...' : 'Valider'}
          </button>
        )}
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => setReason('')}
          disabled={deleteMutation.isPending || reasonIsMissing}
        >
          Effacer le motif
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:border-rose-600 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60 dark:border-rose-400 dark:bg-rose-500"
          onClick={handleDelete}
          disabled={deleteMutation.isPending || reasonIsMissing}
        >
          {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </article>
  )
}

export default ModerationReviewCard
