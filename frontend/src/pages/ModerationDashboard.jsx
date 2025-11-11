import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Loader from '../components/Loader.jsx'
import ModerationReviewCard from '../components/ModerationReviewCard.jsx'
import { fetchReviewModerationFeed } from '../api/reviews'

const ModerationDashboard = () => {
  const [filter, setFilter] = useState('pending')
  const reviewsQuery = useQuery({
    queryKey: ['moderation-feed'],
    queryFn: () => fetchReviewModerationFeed({ limit: 30 }),
    staleTime: 30_000,
  })

  const reviews = reviewsQuery.data ?? []
  const pendingCount = reviews.filter((review) => review.moderationStatus !== 'approved').length

  const filteredReviews = useMemo(() => {
    const baseReviews = reviewsQuery.data ?? []
    if (filter === 'pending') {
      return baseReviews.filter((review) => review.moderationStatus !== 'approved')
    }
    return baseReviews
  }, [filter, reviewsQuery.data])

  if (reviewsQuery.isLoading) {
    return <Loader label="Chargement des avis à modérer..." />
  }

  if (reviewsQuery.isError) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-primary">Modération des avis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Impossible de récupérer la liste des avis. Veuillez réessayer dans un instant.
          </p>
        </header>
        <button
          type="button"
          className="btn w-full sm:w-auto"
          onClick={() => reviewsQuery.refetch()}
        >
          Réessayer
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Modération des avis</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Surveillez les derniers avis publiés et supprimez ceux qui enfreignent les règles de la
          communauté.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-slate-600 dark:text-slate-300">
            {reviews.length ? (
              pendingCount > 0 ? (
                <>
                  {pendingCount}{' '}
                  {pendingCount > 1
                    ? 'avis en attente de validation'
                    : 'avis en attente de validation'}
                </>
              ) : (
                'Tous les avis récents ont été validés'
              )
            ) : (
              'Aucun nouvel avis à contrôler'
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
              filter === 'pending'
                ? 'border-primary bg-primary text-white focus:ring-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
            onClick={() => setFilter('pending')}
          >
            En attente
          </button>
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
              filter === 'all'
                ? 'border-primary bg-primary text-white focus:ring-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-300">
          Tout est calme pour le moment. Revenez plus tard ou actualisez la page.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredReviews.map((review) => (
            <ModerationReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

    </section>
  )
}

export default ModerationDashboard
