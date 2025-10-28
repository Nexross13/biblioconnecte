import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchBooks } from '../api/books'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import { fetchFriends } from '../api/users'
import { fetchBookProposals } from '../api/bookProposals'
import useAuth from '../hooks/useAuth'
import Loader from '../components/Loader.jsx'
import getAverageRating from '../utils/getAverageRating'

const Dashboard = () => {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'

  const booksQuery = useQuery({
    queryKey: ['books-dashboard'],
    queryFn: () => fetchBooks(),
  })
  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
  })
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })
  const friendsQuery = useQuery({
    queryKey: ['friends', user.id],
    queryFn: () => fetchFriends(user.id),
  })
  const pendingProposalsQuery = useQuery({
    queryKey: ['book-proposals', 'pending'],
    queryFn: () => fetchBookProposals({ status: 'pending' }),
    enabled: isAdmin,
  })

  const isLoading =
    booksQuery.isLoading ||
    libraryQuery.isLoading ||
    wishlistQuery.isLoading ||
    friendsQuery.isLoading ||
    (isAdmin && pendingProposalsQuery.isLoading)

  if (isLoading) {
    return <Loader label="Chargement du tableau de bord..." />
  }

  const pendingProposals = isAdmin ? pendingProposalsQuery.data?.proposals ?? [] : []
  const pendingProposalsCount = isAdmin
    ? pendingProposalsQuery.data?.pagination?.count ?? pendingProposals.length
    : 0

  const stats = [
    {
      label: 'Livres dans ma bibliothèque',
      value: libraryQuery.data?.length ?? 0,
    },
    {
      label: 'Livres dans ma wishlist',
      value: wishlistQuery.data?.length ?? 0,
    },
    {
      label: 'Amis connectés',
      value: friendsQuery.data?.length ?? 0,
    },
    {
      label: 'Titres disponibles dans le catalogue',
      value: booksQuery.data?.books?.length ?? 0,
    },
  ]

  if (isAdmin) {
    stats.push({
      label: 'Propositions en attente',
      value: pendingProposalsCount,
    })
  }

  const ratings = booksQuery.data?.books
    ?.map((book) => book.reviews)
    ?.flat()
    ?.filter(Boolean)

  const averageRating = getAverageRating(ratings)

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Tableau de bord</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Une vue synthétique de vos activités de lecture.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">{stat.value}</p>
          </div>
        ))}
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Note moyenne globale
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {averageRating ? averageRating.toFixed(2) : 'N/A'}
          </p>
        </div>
      </div>
      {isAdmin && (
        <section className="space-y-4">
          <header>
            <h2 className="text-xl font-semibold text-primary">Validation des livres</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Consultez les ouvrages proposés par la communauté avant leur publication.
            </p>
          </header>
          <div className="card divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {pendingProposals.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aucune proposition n’attend votre validation pour l’instant.
              </p>
            ) : (
              pendingProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="py-3 first:pt-0 last:pb-0 md:flex md:items-center md:justify-between md:gap-6"
                >
                  <div>
                    <Link
                      to={`/admin/book-proposals/${proposal.id}`}
                      className="text-base font-semibold text-primary hover:underline"
                    >
                      {proposal.title}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Soumis par {proposal.submittedBy?.firstName ?? 'Utilisateur'}{' '}
                      {proposal.submittedBy?.lastName ?? ''} •{' '}
                      {new Date(proposal.submittedAt).toLocaleDateString('fr-FR')}
                    </p>
                    {proposal.authorNames?.length ? (
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        Auteur(s) : {proposal.authorNames.join(', ')}
                      </p>
                    ) : null}
                    {proposal.genreNames?.length ? (
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        Genre(s) : {proposal.genreNames.join(', ')}
                      </p>
                    ) : null}
                    {proposal.summary && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-200 line-clamp-2">
                        {proposal.summary}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm md:mt-0">
                    {proposal.isbn && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                        ISBN {proposal.isbn}
                      </span>
                    )}
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      En attente
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </section>
  )
}

export default Dashboard
