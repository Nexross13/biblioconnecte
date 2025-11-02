import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies'

const CONSENT_COOKIE_NAME = 'cookie_consent'
const THEME_COOKIE_NAME = 'pref_theme'
const THIRTEEN_MONTHS_SECONDS = 60 * 60 * 24 * 30 * 13

const CookieBanner = () => {
  const { isAuthenticated } = useAuth()
  const [consent, setConsent] = useState(() => readCookie(CONSENT_COOKIE_NAME))
  const [previousConsent, setPreviousConsent] = useState(consent)
  const [isOpen, setIsOpen] = useState(() => false)

  useEffect(() => {
    const handler = () => {
      const value = readCookie(CONSENT_COOKIE_NAME)
      setConsent(value)
      setPreviousConsent(value)
      setIsOpen(false)
    }
    window.addEventListener('cookie-consent-change', handler)
    return () => window.removeEventListener('cookie-consent-change', handler)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (!consent && previousConsent) {
      deleteCookie(THEME_COOKIE_NAME)
    }

    setIsOpen(!consent)
  }, [isAuthenticated, consent, previousConsent])

  const acknowledge = (value) => {
    writeCookie(CONSENT_COOKIE_NAME, value, {
      maxAgeSeconds: THIRTEEN_MONTHS_SECONDS,
      sameSite: 'Lax',
    })
    if (value === 'refused' || value === 'essentials') {
      deleteCookie(THEME_COOKIE_NAME)
    }
    if (value === 'accepted') {
      writeCookie(THEME_COOKIE_NAME, readCookie(THEME_COOKIE_NAME) || 'light', {
        maxAgeSeconds: THIRTEEN_MONTHS_SECONDS,
        sameSite: 'Lax',
      })
    }
    window.dispatchEvent(new Event('cookie-consent-change'))
    setConsent(value)
    setPreviousConsent(value)
    setIsOpen(false)
  }

  if (!isAuthenticated || !isOpen) {
    return null
  }

  return (
    <aside className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-primary">Gestion des cookies</h2>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
        Nous utilisons des cookies indispensables au fonctionnement (connexion sécurisée) et des cookies
        optionnels pour mémoriser vos préférences (mode sombre). Vous pouvez accepter uniquement les essentiels
        ou les refuser. Les cookies indispensables resteront actifs pour garantir votre connexion.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn"
          onClick={() => acknowledge('accepted')}
        >
          Accepter tous les cookies
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => acknowledge('essentials')}
        >
          Accepter l’essentiel
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => acknowledge('refused')}
        >
          Refuser
        </button>
      </div>
    </aside>
  )
}

export default CookieBanner
