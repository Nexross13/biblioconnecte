import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchBookProposals } from '../api/bookProposals'
import { fetchAdminOverview } from '../api/stats'
import Loader from '../components/Loader.jsx'
import TimelineChart from '../components/TimelineChart.jsx'

const Dashboard = () => {
  const adminOverviewQuery = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
  })
  const pendingProposalsQuery = useQuery({
    queryKey: ['book-proposals', 'pending'],
    queryFn: () => fetchBookProposals({ status: 'pending' }),
  })

  if (adminOverviewQuery.isLoading || pendingProposalsQuery.isLoading) {
    return <Loader label="Chargement du tableau de bord..." />
  }

  if (adminOverviewQuery.isError || pendingProposalsQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger les métriques administrateur. Veuillez réessayer plus tard.
      </p>
    )
  }

  const totals = adminOverviewQuery.data?.totals ?? {
    books: 0,
    members: 0,
    pendingProposals: 0,
  }
  const timeline = (adminOverviewQuery.data?.timeline ?? []).slice(-30)
  const pendingProposals = pendingProposalsQuery.data?.proposals ?? []
  const pendingCount =
    pendingProposalsQuery.data?.pagination?.count ?? pendingProposals.length ?? totals.pendingProposals

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Tableau de bord</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Suivez l’activité globale de la plateforme et gérez les contributions de la communauté.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Livres dans le catalogue
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {new Intl.NumberFormat('fr-FR').format(totals.books)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Comptes créés
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {new Intl.NumberFormat('fr-FR').format(totals.members)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Propositions en attente
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {new Intl.NumberFormat('fr-FR').format(pendingCount)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <header>
            <h2 className="text-xl font-semibold text-primary">Propositions en attente</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Passez en revue les titres proposés avant leur mise en catalogue.
            </p>
          </header>
          <div className="card divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {pendingProposals.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aucune proposition n’attend votre validation pour le moment.
              </p>
            ) : (
              pendingProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="py-3 first:pt-0 last:pb-0 lg:flex lg:items-start lg:justify-between lg:gap-6"
                >
                  <div className="space-y-1">
                    <Link
                      to={`/admin/book-proposals/${proposal.id}`}
                      className="text-base font-semibold text-primary hover:underline"
                    >
                      {proposal.title}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Soumis par {proposal.submittedBy?.firstName ?? 'Utilisateur'}{' '}
                      {proposal.submittedBy?.lastName ?? ''} •{' '}
                      {proposal.submittedAt
                        ? new Date(proposal.submittedAt).toLocaleDateString('fr-FR')
                        : 'Date inconnue'}
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
                  <div className="mt-3 flex flex-col items-start gap-2 text-xs lg:mt-0">
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

        <section className="space-y-4">
          <header>
            <h2 className="text-xl font-semibold text-primary">Progression quotidienne</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Cumul des livres et des comptes créés sur les 30 derniers jours.
            </p>
          </header>
          <div className="card">
            {timeline.length > 1 ? (
              <TimelineChart data={timeline} />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Pas encore assez de données pour tracer la courbe.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Dashboard
