import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UsersIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { fetchPublicOverview } from '../api/stats'

const statFormatter = new Intl.NumberFormat('fr-FR')

const formatStat = (value) => (Number.isFinite(value) ? statFormatter.format(value) : '—')

const Footer = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-overview'],
    queryFn: fetchPublicOverview,
    staleTime: 1000 * 60 * 10,
  })

  const counts = data?.counts ?? {}

  const highlightedStats = useMemo(
    () => [
      {
        label: 'Lecteurs actifs',
        value: counts.members,
        icon: UsersIcon,
      },
      {
        label: 'Livres partagés',
        value: counts.books,
        icon: BookOpenIcon,
      },
      {
        label: 'Avis publiés',
        value: counts.reviews,
        icon: ChatBubbleLeftRightIcon,
      },
    ],
    [counts.members, counts.books, counts.reviews],
  )

  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6 lg:py-16 lg:text-left">
        <div className="grid gap-10 justify-items-center sm:grid-cols-2 lg:grid-cols-4 lg:items-start lg:justify-items-center">
          <div className="w-full max-w-sm space-y-4 sm:max-w-none">
            <h2 className="text-xl font-semibold text-white">BiblioConnecte</h2>
            <p className="text-sm text-slate-300">
              La communauté où les lecteurs partagent leurs coups de cœur, suivent leurs amis et
              proposent les prochaines pépites du catalogue.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2 sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Communauté
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <Link className="transition hover:text-white" to="/register">
                  Rejoindre la plateforme
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/login">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/books/new">
                  Proposer un livre
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/dashboard">
                  Espace membres
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full max-w-xs space-y-2 sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Ressources
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  className="flex items-center gap-2 transition hover:text-white"
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation API
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/register">
                  Guide de démarrage
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="#">
                  Journal de la communauté (bientôt)
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="#">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full max-w-sm sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">Vue d’ensemble</p>
              <div className="space-y-3">
                {highlightedStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-white/80">{label}</p>
                      <p className="text-lg font-semibold text-white">
                        {isLoading ? (
                          <span className="block h-6 w-16 animate-pulse rounded bg-white/20" />
                        ) : isError ? (
                          '—'
                        ) : (
                          formatStat(value)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {isError ? (
                <p className="text-xs text-white/60">
                  Les statistiques publiques sont momentanément indisponibles.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-white/70 text-center md:flex-row md:items-center md:justify-between md:px-6 md:text-left">
          <p>© {currentYear} BiblioConnecte. Tous droits réservés.</p>
          <p>
            Projet communautaire pour partager, explorer et recommander des livres entre passionnés.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
