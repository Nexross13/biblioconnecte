import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { approveReview, deleteReview, updateReview } from '../api/reviews'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'

const ReviewCard = ({ review }) => {
  const { user } = useAuth()
  const canManage = user?.id === review.userId
  const canModerate = user?.role === 'admin' || user?.role === 'moderator'
  const queryClient = useQueryClient()
  const isApproved = review.moderationStatus === 'approved'
  const moderatorName = [review.moderator?.firstName, review.moderator?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  const deleteMutation = useMutation({
    mutationFn: (payload) => deleteReview(review.id, payload),
    onSuccess: () => {
      toast.success('Avis supprimé')
      queryClient.invalidateQueries({ queryKey: ['bookReviews', review.bookId] })
      queryClient.invalidateQueries({ queryKey: ['moderation-feed'] })
    },
    onError: () => toast.error("Impossible de supprimer l'avis"),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveReview(review.id),
    onSuccess: () => {
      toast.success('Avis validé')
      queryClient.invalidateQueries({ queryKey: ['bookReviews', review.bookId] })
      queryClient.invalidateQueries({ queryKey: ['moderation-feed'] })
    },
    onError: () => toast.error("Impossible de valider l'avis"),
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateReview(review.id, payload),
    onSuccess: () => {
      toast.success('Avis mis à jour')
      queryClient.invalidateQueries({ queryKey: ['bookReviews', review.bookId] })
    },
    onError: () => toast.error("Impossible de mettre à jour l'avis"),
  })

  const handleUpdate = () => {
    const newRating = Number(
      window.prompt('Nouvelle note (1-5) :', review.rating?.toString() ?? '5'),
    )
    if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) {
      toast.error('Note invalide')
      return
    }
    const newComment = window.prompt('Nouveau commentaire :', review.comment || '')
    updateMutation.mutate({ rating: newRating, comment: newComment })
  }

  const handleDelete = () => {
    let payload
    if (!canManage && canModerate) {
      const reason = window.prompt('Motif de la suppression (obligatoire) :')
      if (!reason || !reason.trim()) {
        toast.error('Merci de saisir un motif de suppression')
        return
      }
      payload = { reason: reason.trim() }
    } else {
      const confirmed = window.confirm('Confirmer la suppression de cet avis ?')
      if (!confirmed) {
        return
      }
    }
    deleteMutation.mutate(payload)
  }

  const showModerationActions = canManage || canModerate

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">
          {review.author?.firstName} {review.author?.lastName}
        </p>
        <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900">
          ⭐ {review.rating}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Publié le {formatDate(review.createdAt)}
        </p>
        {canModerate &&
          (isApproved ? (
            <p className="text-xs font-semibold text-emerald-600">
              Validé {moderatorName ? `par ${moderatorName}` : ''}
            </p>
          ) : (
            <p className="text-xs font-semibold text-amber-600">En attente de validation</p>
          ))}
      </div>
      {showModerationActions && (
        <div className="flex flex-wrap gap-2 text-xs">
          {canModerate && !isApproved && (
            <button
              type="button"
              className="rounded-lg border border-emerald-500 px-3 py-1 font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Validation...' : 'Valider'}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="rounded-lg border border-primary px-3 py-1 font-medium text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Modifier'}
            </button>
          )}
          <button
            type="button"
            className="rounded-lg border border-rose-500 px-3 py-1 font-medium text-rose-600 transition hover:bg-rose-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewCard
