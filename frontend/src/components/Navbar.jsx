import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import useAuth from '../hooks/useAuth'

const navLinks = [
  { to: '/', label: 'Accueil', private: false },
  { to: '/library', label: 'Ma bibliothèque', private: true },
  { to: '/wishlist', label: 'Souhaits', private: true },
  { to: '/friends', label: 'Amis', private: true },
  { to: '/dashboard', label: 'Tableau de bord', private: true },
  { to: '/profile', label: 'Profil', private: true },
]

const storageKey = 'biblio_theme'

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || 'light')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem(storageKey, theme)
  }, [theme])

  const filteredLinks = useMemo(
    () => navLinks.filter((link) => (link.private ? isAuthenticated : true)),
    [isAuthenticated],
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const linkClassName = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-primary text-white shadow'
        : 'text-slate-700 hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700'
    }`

  return (
    <header className="bg-white/80 shadow-sm backdrop-blur dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary md:hidden dark:text-slate-100"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Menu"
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
          <Link to="/" className="text-lg font-semibold text-primary">
            BiblioConnecte
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {filteredLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClassName}>
              {link.label}
            </NavLink>
          ))}
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
        <nav className="space-y-2 px-4 pb-4 md:hidden">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              className="btn-secondary w-full text-xs"
              onClick={() => {
                handleLogout()
                setIsMenuOpen(false)
              }}
            >
              Déconnexion
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink
                to="/login"
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                className="btn text-xs"
                onClick={() => setIsMenuOpen(false)}
              >
                Inscription
              </NavLink>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}

export default Navbar
