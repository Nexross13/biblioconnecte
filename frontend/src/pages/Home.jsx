import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  PencilSquareIcon,
  BookmarkIcon,
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchBooks } from '../api/books'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import { fetchHighlights, fetchPublicOverview } from '../api/stats'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'
import { ASSETS_BOOKS_BASE_URL, ASSETS_PROFILE_BASE_URL } from '../api/axios'

const statNumberFormatter = new Intl.NumberFormat('fr-FR')
const formatStatValue = (value) =>
  Number.isFinite(value) ? statNumberFormatter.format(value) : '—'
const PLACEHOLDER_AVATAR = '/placeholder-user.svg'
const PLACEHOLDER_COVER = '/placeholder-book.svg'
const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  const highlightsQuery = useQuery({
    queryKey: ['highlights'],
    queryFn: fetchHighlights,
    enabled: isAuthenticated,
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

  const booksQuery = useQuery({
    queryKey: ['books-search', submittedSearch],
    queryFn: () => fetchBooks({ search: submittedSearch }),
    enabled: isAuthenticated && Boolean(submittedSearch),
  })

  const publicOverviewQuery = useQuery({
    queryKey: ['public-overview'],
    queryFn: fetchPublicOverview,
    enabled: !isAuthenticated,
  })

  const libraryIds = useMemo(
    () => new Set((libraryQuery.data || []).map((item) => item.id)),
    [libraryQuery.data],
  )
  const wishlistIds = useMemo(
    () => new Set((wishlistQuery.data || []).map((item) => item.id)),
    [wishlistQuery.data],
  )

  const topReader = highlightsQuery.data?.topReader ?? null
  const topRatedBook = highlightsQuery.data?.topRatedBook ?? null

  const topReaderAvatarCandidates = useMemo(() => {
    const userId = topReader?.user?.id
    if (!userId) {
      return []
    }
    return AVATAR_EXTENSIONS.map((extension) => `${ASSETS_PROFILE_BASE_URL}/${userId}.${extension}`)
  }, [topReader?.user?.id])

  const [topReaderAvatarSrc, setTopReaderAvatarSrc] = useState(PLACEHOLDER_AVATAR)
  const [topReaderAvatarIndex, setTopReaderAvatarIndex] = useState(0)

  useEffect(() => {
    if (!topReaderAvatarCandidates.length) {
      setTopReaderAvatarSrc(PLACEHOLDER_AVATAR)
      setTopReaderAvatarIndex(0)
      return
    }
    setTopReaderAvatarSrc(topReaderAvatarCandidates[0])
    setTopReaderAvatarIndex(0)
  }, [topReaderAvatarCandidates])

  const topRatedCoverCandidates = useMemo(() => {
    const isbn = topRatedBook?.book?.isbn
    if (!isbn) {
      return []
    }
    return COVER_EXTENSIONS.map((extension) => `${ASSETS_BOOKS_BASE_URL}/${isbn}.${extension}`)
  }, [topRatedBook?.book?.isbn])

  const [topRatedCoverSrc, setTopRatedCoverSrc] = useState(PLACEHOLDER_COVER)
  const [topRatedCoverIndex, setTopRatedCoverIndex] = useState(0)

  useEffect(() => {
    if (!topRatedCoverCandidates.length) {
      setTopRatedCoverSrc(PLACEHOLDER_COVER)
      setTopRatedCoverIndex(0)
      return
    }
    setTopRatedCoverSrc(topRatedCoverCandidates[0])
    setTopRatedCoverIndex(0)
  }, [topRatedCoverCandidates])

  const counts = !isAuthenticated ? publicOverviewQuery.data?.counts ?? {} : {}
  const activity = !isAuthenticated ? publicOverviewQuery.data?.activity ?? {} : {}
  const popularGenres = !isAuthenticated ? publicOverviewQuery.data?.popularGenres ?? [] : []
  const recentPublicBooks = !isAuthenticated ? publicOverviewQuery.data?.recentBooks ?? [] : []

  const hero = isAuthenticated ? (
    <header className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-10 text-white shadow-lg md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Bienvenue sur My BiblioConnect</h1>
        <p className="mt-2 max-w-2xl text-sm md:text-base">
          Explorez la communauté de lecteurs, suivez l&apos;activité de vos amis et partagez vos
          découvertes littéraires.
        </p>
      </div>
      <form
        className="w-full max-w-sm"
        onSubmit={(event) => {
          event.preventDefault()
          if (!isAuthenticated) {
            return
          }
          setSubmittedSearch(searchInput.trim())
        }}
      >
        <div className="flex rounded-lg bg-white/20 p-1 shadow-inner backdrop-blur">
          <input
            type="search"
            name="search"
            placeholder="Rechercher un livre, un auteur..."
            className="input flex-1 border-none bg-transparent text-white placeholder:text-white/70 focus:ring-white/50"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            disabled={!isAuthenticated}
          />
          <button
            type="submit"
            className="btn ml-2 bg-white text-primary hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-primary/60"
            disabled={!isAuthenticated}
          >
            Rechercher
          </button>
        </div>
        {!isAuthenticated && (
          <p className="mt-2 text-center text-xs text-white/80">
            Connectez-vous pour explorer le catalogue complet.
          </p>
        )}
      </form>
    </header>
  ) : (
    <header className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-2xl">
      <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute -right-14 bottom-0 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Votre club de lecture connecté
          </span>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            Partagez vos livres. Inspirez vos amis. Cultivez votre univers.
          </h1>
          <p className="text-sm text-white/80 md:text-base">
            My BiblioConnect rassemble une communauté de lecteurs passionnés : suivez les lectures de
            vos amis, proposez de nouvelles parutions et créez des listes inspirantes pour ne plus
            manquer aucun coup de cœur.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link className="btn bg-white text-primary hover:bg-slate-100" to="/register">
              Créer un compte gratuit
            </Link>
            <Link
              className="btn-secondary border-white/40 text-white hover:border-white hover:text-white"
              to="/login"
            >
              Se connecter
            </Link>
          </div>
        </div>
        <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-white/70">Une communauté active</p>
          <div className="space-y-3">
            {[
              {
                label: 'Lecteurs connectés',
                value: formatStatValue(counts.members),
              },
              {
                label: 'Livres partagés',
                value: formatStatValue(counts.books),
              },
              {
                label: 'Livres ajoutés ce mois-ci',
                value: formatStatValue(activity.booksAddedLast30Days),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-white/70">{item.label}</span>
                <span className="text-lg font-semibold text-white">
                  {publicOverviewQuery.isLoading ? (
                    <span className="block h-5 w-12 animate-pulse rounded bg-white/30" />
                  ) : (
                    item.value
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60">
            Des chiffres qui évoluent en temps réel grâce aux contributions de la communauté.
          </p>
        </div>
      </div>
    </header>
  )

  if (!isAuthenticated) {
    const isPublicLoading = publicOverviewQuery.isLoading
    const isPublicError = publicOverviewQuery.isError

    const primaryStats = [
      {
        label: 'Adhérents',
        value: counts.members,
        description: 'lecteurs passionnés déjà inscrits',
        icon: UsersIcon,
      },
      {
        label: 'Livres référencés',
        value: counts.books,
        description: 'titres partagés par la communauté',
        icon: BookOpenIcon,
      },
      {
        label: 'Auteurs suivis',
        value: counts.authors,
        description: 'plumes disponibles dans le catalogue',
        icon: PencilSquareIcon,
      },
      {
        label: 'Univers explorés',
        value: counts.genres,
        description: 'genres pour varier les plaisirs',
        icon: SparklesIcon,
      },
    ]

    const secondaryStats = [
      {
        label: 'Avis publiés',
        value: counts.reviews,
        description: 'recommandations et critiques',
        icon: ChatBubbleLeftRightIcon,
      },
      {
        label: 'Livres en collection',
        value: counts.libraryEntries,
        description: 'ouvrages ajoutés aux bibliothèques personnelles',
        icon: BookmarkIcon,
      },
      {
        label: 'Liens d’amitié',
        value: counts.acceptedFriendships,
        description: 'lecteurs qui se suivent déjà',
        icon: GlobeAltIcon,
      },
      {
        label: 'Propositions en cours',
        value: counts.pendingProposals,
        description: 'nouveautés à valider par l’équipe',
        icon: ShieldCheckIcon,
      },
    ]

    const featureHighlights = [
      {
        title: 'Composez votre bibliothèque vivante',
        description:
          'Classez vos lectures, suivez vos envies du moment et gardez un œil sur vos prêts entre amis.',
        icon: BookOpenIcon,
      },
      {
        title: 'Invitez vos amis et échangez',
        description:
          'Suivez les découvertes de vos proches, envoyez des coups de cœur et comparez vos envies.',
        icon: UsersIcon,
      },
      {
        title: 'Partagez vos avis et vos listes',
        description:
          'Publiez vos critiques, créez des sélections thématiques et inspirez la communauté.',
        icon: ChatBubbleLeftRightIcon,
      },
      {
        title: 'Proposez de nouveaux titres',
        description:
          'Soumettez vos pépites littéraires pour enrichir le catalogue et votez pour celles des autres.',
        icon: ShieldCheckIcon,
      },
    ]

    return (
      <section className="space-y-12">
        {hero}

        <section className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-primary">Une plateforme riche et animée</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Découvrez l’ampleur de My BiblioConnect avant même de créer votre compte.
              </p>
            </div>
            <ArrowTrendingUpIcon className="hidden h-10 w-10 text-primary md:block" aria-hidden="true" />
          </div>

          {isPublicError ? (
            <p className="text-sm text-rose-600">
              Impossible de récupérer les statistiques publiques pour le moment. Réessayez dans quelques instants.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primaryStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <span className="absolute right-4 top-4 h-20 w-20 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />
                  <div className="relative flex flex-col gap-3">
                    <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                      {stat.label}
                    </h3>
                    <span className="text-3xl font-bold text-primary">
                      {isPublicLoading ? (
                        <span className="block h-9 w-24 animate-pulse rounded bg-primary/10 dark:bg-primary/20" />
                      ) : Number.isFinite(stat.value) ? (
                        `${formatStatValue(stat.value)}+`
                      ) : (
                        '—'
                      )}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {secondaryStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-900/70 dark:to-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    {isPublicLoading ? (
                      <span className="block h-6 w-16 animate-pulse rounded bg-primary/10 dark:bg-primary/20" />
                    ) : Number.isFinite(stat.value) ? (
                      <span className="text-xl font-semibold text-primary">
                        {formatStatValue(stat.value)}
                      </span>
                    ) : (
                      <span className="text-xl font-semibold text-primary">—</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-200">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/70">
              <span className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
              <div className="relative space-y-5">
                <h2 className="text-2xl font-semibold text-primary">Tout ce que vous pouvez faire</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  My BiblioConnect est une plateforme de partage social pour lecteurs exigeants. Voici
                  un aperçu des possibilités qui vous attendent.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featureHighlights.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <div key={feature.title} className="rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/60">
                        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                        <h3 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-primary to-secondary p-8 text-white shadow-xl dark:border-transparent">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Une communauté bienveillante</h2>
                <p className="text-sm text-white/80">
                  Déjà {isPublicLoading ? '...' : formatStatValue(counts.acceptedFriendships)} amitiés forgées
                  autour des livres et des centaines de listes partagées chaque mois.
                </p>
              </div>
              <div className="space-y-3 text-sm text-white/80">
                <p>Les commentaires arrivent bientôt : merci pour votre patience !</p>
              </div>
              <div>
                <Link className="btn bg-white text-primary hover:bg-slate-100" to="/register">
                  Rejoindre la communauté
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary">Derniers livres mis en avant</h2>
              <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                rafraîchi en continu
              </span>
            </div>

            {isPublicLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <span className="block h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <span className="block h-4 w-full animate-pulse rounded bg-slate-200/80 dark:bg-slate-800" />
                    <span className="block h-4 w-2/3 animate-pulse rounded bg-slate-200/70 dark:bg-slate-800/80" />
                  </div>
                ))}
              </div>
            ) : recentPublicBooks.length ? (
              <ul className="space-y-3">
                {recentPublicBooks.map((book) => (
                  <li
                    key={book.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-1 hover:border-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                      {book.title}
                    </p>
                    {book.summary ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                        {book.summary}
                      </p>
                    ) : null}
                    <span className="mt-2 inline-flex items-center text-[11px] uppercase tracking-wide text-primary">
                      Ajouté le {formatDate(book.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aucun livre n&apos;a été ajouté pour le moment, soyez le premier à enrichir le catalogue !
              </p>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-primary">Des genres populaires</h2>
            {isPublicLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="space-y-2">
                    <span className="block h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <span className="block h-3 w-full animate-pulse rounded bg-primary/10 dark:bg-primary/20" />
                  </div>
                ))}
              </div>
            ) : popularGenres.length ? (
              <ul className="space-y-4">
                {popularGenres.map((genre) => (
                  <li key={genre.id}>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-200">
                      <span>{genre.name}</span>
                      <span className="text-xs text-primary">
                        {formatStatValue(genre.bookCount)} livres
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-primary/10 dark:bg-primary/20">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{
                          width: popularGenres[0].bookCount
                            ? `${Math.max(
                                12,
                                Math.round((genre.bookCount / popularGenres[0].bookCount) * 100),
                              )}%`
                            : '12%',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Les genres populaires apparaîtront ici dès que de nouveaux livres seront ajoutés.
              </p>
            )}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <p>
                {isPublicLoading
                  ? 'Chargement des activités récentes...'
                  : `${formatStatValue(activity.newMembersLast30Days)} nouveaux membres et ${formatStatValue(
                      activity.booksAddedLast30Days,
                    )} livres ajoutés au cours des 30 derniers jours.`}
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 px-8 py-10 text-white shadow-2xl dark:border-slate-800">
          <div className="absolute -top-24 left-8 h-48 w-48 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute -bottom-24 right-8 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-3xl font-semibold">Prêt à feuilleter avec nous ?</h2>
              <p className="text-sm text-white/80">
                Créez votre compte pour suivre vos lectures, commenter celles de vos proches et
                enrichir le catalogue de toute la communauté.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn bg-white text-primary hover:bg-slate-100" to="/register">
                Je m’inscris gratuitement
              </Link>
              <Link
                className="btn-secondary border-white/40 text-white hover:border-white hover:text-white"
                to="/login"
              >
                J’ai déjà un compte
              </Link>
            </div>
          </div>
        </section>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      {hero}

      {!submittedSearch ? (
        highlightsQuery.isLoading ? (
          <Loader label="Chargement des tendances..." />
        ) : highlightsQuery.isError ? (
          <p className="text-center text-sm text-rose-600">
            Impossible de récupérer les informations de mise en avant.
          </p>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2">
              <div className="card space-y-4">
                <h2 className="text-xl font-semibold text-primary">
                  <span className="inline-flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                    Lecteur le plus actif
                  </span>
                </h2>
                {topReader ? (
                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/20 md:mx-0">
                      <img
                        src={topReaderAvatarSrc}
                        alt={`Avatar de ${topReader.user.firstName} ${topReader.user.lastName}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          if (topReaderAvatarIndex < topReaderAvatarCandidates.length - 1) {
                            const nextIndex = topReaderAvatarIndex + 1
                            setTopReaderAvatarIndex(nextIndex)
                            setTopReaderAvatarSrc(topReaderAvatarCandidates[nextIndex])
                            return
                          }
                          event.currentTarget.src = PLACEHOLDER_AVATAR
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-100">
                        {topReader.user.firstName} {topReader.user.lastName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {formatStatValue(topReader.totalBooks)} livres enregistrés dans sa
                        bibliothèque.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Aucun lecteur mis en avant pour le moment.
                  </p>
                )}
              </div>

              <div className="card space-y-4">
                <h2 className="text-xl font-semibold text-primary">
                  <span className="inline-flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                    Livre le mieux noté
                  </span>
                </h2>
                {topRatedBook ? (
                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center">
                    <div className="relative aspect-[3/4] w-28 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 md:w-32">
                      <img
                        src={topRatedCoverSrc}
                        alt={`Couverture de ${topRatedBook.book.title}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          if (topRatedCoverIndex < topRatedCoverCandidates.length - 1) {
                            const nextIndex = topRatedCoverIndex + 1
                            setTopRatedCoverIndex(nextIndex)
                            setTopRatedCoverSrc(topRatedCoverCandidates[nextIndex])
                            return
                          }
                          event.currentTarget.src = PLACEHOLDER_COVER
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Link
                        to={`/books/${topRatedBook.book.id}`}
                        className="text-lg font-semibold text-slate-700 hover:text-primary dark:text-slate-100"
                      >
                        {topRatedBook.book.title}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Note moyenne :
                        <span className="ml-1 font-semibold text-primary">
                          ⭐
                          {topRatedBook.averageRating?.toFixed
                            ? ` ${topRatedBook.averageRating.toFixed(2)}`
                            : ` ${topRatedBook.averageRating}`}
                        </span>
                        ({formatStatValue(topRatedBook.totalReviews)} avis)
                      </p>
                      {topRatedBook.book.summary && (
                        <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-3">
                          {topRatedBook.book.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Soyez le premier à laisser un avis pour mettre un livre en lumière.
                  </p>
                )}
              </div>
            </section>

            <section className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                    Dernières parutions
                  </span>
                </h2>
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  5 derniers ajouts
                </span>
              </div>
              {highlightsQuery.data?.latestBooks?.length ? (
                <ul className="space-y-3">
                  {highlightsQuery.data.latestBooks.map((book) => (
                    <li key={book.id} className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/books/${book.id}`}
                          className="text-sm font-semibold text-slate-700 hover:text-primary dark:text-slate-100"
                        >
                          {book.title}
                        </Link>
                        {book.summary && (
                          <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                            {book.summary}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(book.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Aucun ouvrage ajouté récemment.
                </p>
              )}
            </section>
          </>
        )
      ) : null}

      {submittedSearch ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary">Résultats de recherche</h2>
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-300"
              onClick={() => {
                setSubmittedSearch('')
                setSearchInput('')
              }}
            >
              Effacer la recherche
            </button>
          </div>

          {booksQuery.isLoading ? (
            <Loader label="Recherche en cours..." />
          ) : booksQuery.isError ? (
            <p className="text-sm text-rose-600">Impossible de récupérer les résultats.</p>
          ) : (
            <>
              {booksQuery.data?.books?.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {booksQuery.data.books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      inLibrary={libraryIds.has(book.id)}
                      inWishlist={wishlistIds.has(book.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Aucun livre ne correspond à votre recherche.
                </p>
              )}
              <div className="mt-4 flex justify-center">
                <Link
                  to={`/books/new?title=${encodeURIComponent(submittedSearch)}`}
                  className="btn"
                >
                  Proposer un livre
                </Link>
              </div>
            </>
          )}
        </section>
      ) : null}
    </section>
  )
}

export default Home
