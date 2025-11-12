import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import useAuth from '../hooks/useAuth'
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies'
import { fetchFriendRequests } from '../api/users'
import { fetchAdminOverview } from '../api/stats'
import { fetchReviewModerationFeed } from '../api/reviews'

const navLinks = [
  { to: '/', label: 'Accueil', private: false },
  { to: '/library', label: 'Ma bibliothèque', private: true },
  { to: '/friends', label: 'Amis', private: true },
  { to: '/dashboard', label: 'Tableau de bord', private: true, adminOnly: true },
  { to: '/moderation', label: 'Modération', private: true, moderatorOnly: true },
  { to: '/profile', label: 'Profil', private: true },
]

const participationLinks = [
  { to: '/books/new', label: 'Ajouter un ouvrage' },
  { to: '/authors/new', label: 'Ajouter un auteur' },
]
const THEME_COOKIE_NAME = 'pref_theme'
const THIRTEEN_MONTHS_SECONDS = 60 * 60 * 24 * 30 * 13


const CONSENT_COOKIE_NAME = 'cookie_consent'
const PANEL_ANIMATION_DURATION = 400

const CounterBadge = ({ count, srLabel }) => {
  const numericValue = Number(count)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }
  const displayValue = numericValue > 9 ? '+9' : numericValue
  return (
    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
      {displayValue}
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
    </span>
  )
}

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuAnimation, setMenuAnimation] = useState('closed')
  const [isParticipationOpen, setIsParticipationOpen] = useState(false)
  const [isMobileParticipationOpen, setIsMobileParticipationOpen] = useState(false)
  const [theme, setTheme] = useState(() => readCookie(THEME_COOKIE_NAME) || 'light')
  const [canPersistTheme, setCanPersistTheme] = useState(() => readCookie(CONSENT_COOKIE_NAME) === 'accepted')
  const participationRef = useRef(null)
  const isAdmin = user?.role === 'admin'
  const isModerator = user?.role === 'moderator' || isAdmin

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests', user?.id],
    queryFn: () => fetchFriendRequests(user.id),
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: 60_000,
  })

  const adminOverviewQuery = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
    enabled: Boolean(isAuthenticated && isAdmin),
    staleTime: 60_000,
  })

  const moderationFeedQuery = useQuery({
    queryKey: ['moderation-feed'],
    queryFn: () => fetchReviewModerationFeed({ limit: 30 }),
    enabled: Boolean(isAuthenticated && isModerator),
    staleTime: 30_000,
  })

  const friendRequestsCount = friendRequestsQuery.data?.length ?? 0
  const adminTotals = adminOverviewQuery.data?.totals ?? {}
  const pendingReportsCount = adminTotals.pendingReports ?? 0
  const pendingProposalsCount =
    (adminTotals.pendingProposals ?? 0) + (adminTotals.pendingAuthorProposals ?? 0)
  const dashboardPendingCount = pendingReportsCount + pendingProposalsCount
  const pendingReviewsCount = useMemo(() => {
    if (!moderationFeedQuery.data) return 0
    return moderationFeedQuery.data.filter((review) => review.moderationStatus !== 'approved').length
  }, [moderationFeedQuery.data])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    if (canPersistTheme) {
      writeCookie(THEME_COOKIE_NAME, theme, { maxAgeSeconds: THIRTEEN_MONTHS_SECONDS })
    } else {
      deleteCookie(THEME_COOKIE_NAME)
    }
  }, [theme, canPersistTheme])

  useEffect(() => {
    const handler = () => {
      setCanPersistTheme(readCookie(CONSENT_COOKIE_NAME) === 'accepted')
    }
    window.addEventListener('cookie-consent-change', handler)
    return () => window.removeEventListener('cookie-consent-change', handler)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (participationRef.current && !participationRef.current.contains(event.target)) {
        setIsParticipationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      setIsMobileParticipationOpen(false)
    }
  }, [isMenuOpen])

  useEffect(() => {
    let timerId
    if (menuAnimation === 'opening') {
      timerId = setTimeout(() => {
        setMenuAnimation('open')
      }, PANEL_ANIMATION_DURATION)
    } else if (menuAnimation === 'closing') {
      timerId = setTimeout(() => {
        setMenuAnimation('closed')
        setIsMenuOpen(false)
      }, PANEL_ANIMATION_DURATION)
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId)
      }
    }
  }, [menuAnimation])

  const filteredLinks = useMemo(
    () =>
      navLinks.filter((link) => {
        if (link.adminOnly) {
          return isAuthenticated && user?.role === 'admin'
        }
        if (link.moderatorOnly) {
          return (
            isAuthenticated && (user?.role === 'moderator' || user?.role === 'admin')
          )
        }
        if (link.private) {
          return isAuthenticated
        }
        return true
      }),
    [isAuthenticated, user?.role],
  )

  const handleLogout = () => {
    logout().finally(() => {
      navigate('/login')
    })
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const openMenu = () => {
    setIsMenuOpen(true)
    setMenuAnimation('opening')
  }

  const requestCloseMenu = () => {
    setMenuAnimation((current) => {
      if (current === 'closed' || current === 'closing') {
        return current
      }
      return 'closing'
    })
  }

  const handleMenuToggle = () => {
    if (!isMenuOpen || menuAnimation === 'closed') {
      openMenu()
      return
    }
    if (menuAnimation === 'closing') {
      setMenuAnimation('opening')
      return
    }
    requestCloseMenu()
  }

  const handleMenuLinkClick = () => {
    requestCloseMenu()
  }

  const drawerAnimationClass =
    menuAnimation === 'opening'
      ? 'drawer-panel drawer-panel--opening'
      : menuAnimation === 'closing'
        ? 'drawer-panel drawer-panel--closing'
        : 'drawer-panel'

  const linkClassName = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-primary text-white shadow'
        : 'text-slate-700 hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700'
    }`

  const renderLinkLabel = (link) => {
    const badges = []
    if (link.to === '/friends') {
      badges.push(
        <CounterBadge
          key="friends"
          count={friendRequestsCount}
          srLabel="Demandes d'ami en attente"
        />,
      )
    }
    if (link.to === '/dashboard') {
      badges.push(
        <CounterBadge
          key="dashboard"
          count={dashboardPendingCount}
          srLabel="Signalements et propositions en attente"
        />,
      )
    }
    if (link.to === '/moderation') {
      badges.push(
        <CounterBadge
          key="reviews"
          count={pendingReviewsCount}
          srLabel="Commentaires à valider"
        />,
      )
    }
    const visibleBadges = badges.filter(Boolean)
    if (!visibleBadges.length) {
      return link.label
    }
    return (
      <span className="inline-flex items-center gap-1.5">
        <span>{link.label}</span>
        {visibleBadges}
      </span>
    )
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary xl:hidden dark:text-slate-100"
            onClick={handleMenuToggle}
            aria-label="Menu"
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
          <Link to="/" className="text-lg font-semibold text-primary">
            My BiblioConnect
          </Link>
        </div>

        <nav className="hidden items-center gap-2 xl:flex">
          {filteredLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClassName}>
              {renderLinkLabel(link)}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="relative" ref={participationRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 dark:hover:bg-slate-700"
                onClick={() => setIsParticipationOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isParticipationOpen}
              >
                Je participe
                <ChevronDownIcon
                  className={`h-4 w-4 transition ${isParticipationOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isParticipationOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800">
                  {participationLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setIsParticipationOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {isAuthenticated ? (
            <button type="button" className="btn-secondary text-xs" onClick={handleLogout}>
              Déconnexion
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClassName}>
                Connexion
              </NavLink>
              <NavLink to="/register" className="btn text-xs">
                Inscription
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="hidden text-sm text-slate-600 md:inline dark:text-slate-200">
              Bonjour, <strong>{user?.firstName}</strong>
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex xl:hidden bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <nav
            className={`${drawerAnimationClass} relative flex h-fit max-h-full w-72 max-w-sm flex-col space-y-2 self-start overflow-y-auto rounded-br-3xl border-r border-slate-200 bg-white !bg-opacity-100 px-5 pb-6 pt-6 shadow-2xl transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 !dark:bg-opacity-100`}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                Navigation
              </span>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={requestCloseMenu}
                aria-label="Fermer le menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {filteredLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
                onClick={handleMenuLinkClick}
              >
                {renderLinkLabel(link)}
              </NavLink>
            ))}

            {isAuthenticated && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 dark:hover:bg-slate-700"
                  onClick={() => setIsMobileParticipationOpen((prev) => !prev)}
                  aria-expanded={isMobileParticipationOpen}
                >
                  Je participe
                  <ChevronDownIcon
                    className={`h-4 w-4 transition ${isMobileParticipationOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isMobileParticipationOpen && (
                  <div className="space-y-2">
                    {participationLinks.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          handleMenuLinkClick()
                          setIsMobileParticipationOpen(false)
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <button
                type="button"
                className="btn-secondary w-full text-xs"
                onClick={() => {
                  handleLogout()
                  requestCloseMenu()
                }}
              >
                Déconnexion
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/login"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
                  onClick={handleMenuLinkClick}
                >
                  Connexion
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn text-xs"
                  onClick={handleMenuLinkClick}
                >
                  Inscription
                </NavLink>
              </div>
            )}
          </nav>

          <div className="flex-1 h-full cursor-pointer" onClick={requestCloseMenu} />
        </div>
      )}
    </header>
  )
}

export default Navbar
