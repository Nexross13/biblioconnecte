import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { AdjustmentsHorizontalIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid'
import { fetchUserById, fetchUserLibraryById, fetchUserWishlistById } from '../api/users'
import Loader from '../components/Loader.jsx'
import BookSummaryCard from '../components/BookSummaryCard.jsx'
import SortDropdown from '../components/SortDropdown.jsx'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'
import { readCookie, writeCookie } from '../utils/cookies'
import formatBookTitle from '../utils/formatBookTitle'
import formatBookAuthors from '../utils/formatBookAuthors'
import { LIBRARY_VIEW_COOKIE, LIBRARY_VIEW_MODES } from '../constants/libraryView'
import { LIBRARY_SORT_OPTIONS, DEFAULT_LIBRARY_SORT } from '../constants/librarySort'
import {
  compareBooksBySeriesAndVolume,
  getBookAddedTimestamp,
  getSeriesInitialLetter,
} from '../utils/bookSorting'
import { buildSearchQuery, matchesSearchQuery } from '../utils/search-utils'

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'library', label: 'Possédé' },
  { id: 'wishlist', label: 'Souhaits' },
]

const FriendCollection = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const friendId = Number(id)
  const initialFilter = location.state?.initialFilter ?? 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState(DEFAULT_LIBRARY_SORT)
  const [viewMode, setViewMode] = useState(() => {
    const stored = readCookie(LIBRARY_VIEW_COOKIE)
    return stored === 'list' ? 'list' : 'cards'
  })
  const toggleViewMode = () => {
    setViewMode((previous) => (previous === 'cards' ? 'list' : 'cards'))
  }

  useEffect(() => {
    writeCookie(LIBRARY_VIEW_COOKIE, viewMode, {
      maxAgeSeconds: 60 * 60 * 24 * 365,
      sameSite: 'Strict',
    })
  }, [viewMode])

  const friendQuery = useQuery({
    queryKey: ['friend', friendId],
    queryFn: () => fetchUserById(friendId),
    initialData: location.state?.friend,
  })

  const libraryQuery = useQuery({
    queryKey: ['friendLibrary', friendId],
    queryFn: () => fetchUserLibraryById(friendId),
    enabled: friendId > 0,
  })

  const wishlistQuery = useQuery({
    queryKey: ['friendWishlist', friendId],
    queryFn: () => fetchUserWishlistById(friendId),
    enabled: friendId > 0,
  })

  const combinedEntries = useMemo(() => {
    const libraryBooks = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
    const wishlistBooks = Array.isArray(wishlistQuery.data) ? wishlistQuery.data : []
    const map = new Map()

    libraryBooks.forEach((book) => {
      map.set(book.id, { book, inLibrary: true, inWishlist: false })
    })

    wishlistBooks.forEach((book) => {
      const existing = map.get(book.id)
      if (existing) {
        map.set(book.id, { book: existing.book, inLibrary: true, inWishlist: true })
      } else {
        map.set(book.id, { book, inLibrary: false, inWishlist: true })
      }
    })

    return Array.from(map.values())
  }, [libraryQuery.data, wishlistQuery.data])

  const friendStats = useMemo(() => {
    const ownedBooks = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
    const genreCounts = new Map()
    const authorCounts = new Map()
    const seriesCounts = new Map()

    const incrementCount = (map, key) => {
      if (!key) {
        return
      }
      const trimmed = key.trim()
      if (!trimmed) {
        return
      }
      map.set(trimmed, (map.get(trimmed) || 0) + 1)
    }

    ownedBooks.forEach((book) => {
      const genres = Array.isArray(book.genres)
        ? book.genres.map((genre) => genre.name).filter(Boolean)
        : Array.isArray(book.genreNames)
        ? book.genreNames.filter(Boolean)
        : []
      genres.forEach((genreName) => incrementCount(genreCounts, genreName))

      const authors = Array.isArray(book.authors)
        ? book.authors
            .map((author) => [author.firstName, author.lastName].filter(Boolean).join(' ').trim())
            .filter(Boolean)
        : Array.isArray(book.authorNames)
        ? book.authorNames.filter(Boolean)
        : []
      authors.forEach((authorName) => incrementCount(authorCounts, authorName))
    })

    const getSeriesKey = (book) => {
      if (!book || !book.title) {
        return ''
      }
      return book.title.toString().trim().toLowerCase()
    }

    combinedEntries.forEach(({ book, inLibrary }) => {
      const key = getSeriesKey(book)
      if (!key) {
        return
      }
      const entry = seriesCounts.get(key) || { total: 0, owned: 0 }
      entry.total += 1
      if (inLibrary) {
        entry.owned += 1
      }
      seriesCounts.set(key, entry)
    })

    const seriesInProgress = Array.from(seriesCounts.values()).filter(
      ({ owned, total }) => owned > 0 && total > owned,
    ).length

    const getTopEntry = (map) => {
      let best = null
      map.forEach((count, name) => {
        if (!best || count > best.count) {
          best = { name, count }
        }
      })
      return best?.name ?? null
    }

    return {
      ownedCount: ownedBooks.length,
      favoriteGenre: getTopEntry(genreCounts),
      favoriteAuthor: getTopEntry(authorCounts),
      seriesInProgress,
    }
  }, [combinedEntries, libraryQuery.data])

  const items = useMemo(() => {
    const owned = (libraryQuery.data || []).map((book) => ({ ...book, status: 'library' }))
    const wished = (wishlistQuery.data || []).map((book) => ({ ...book, status: 'wishlist' }))

    if (filter === 'library') return owned
    if (filter === 'wishlist') return wished

    const merged = [...owned]
    wished.forEach((book) => {
      const exists = merged.find((item) => item.id === book.id && item.status === 'library')
      if (exists) {
        merged.push({ ...book, status: 'wishlist' })
      } else {
        merged.push(book)
      }
    })
    return merged
  }, [libraryQuery.data, wishlistQuery.data, filter])

  const searchQuery = useMemo(() => buildSearchQuery(searchTerm), [searchTerm])

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return items
    }
    const matchesQuery = (book) => {
      return matchesSearchQuery(
        [
          formatBookTitle(book),
          book.summary,
          book.isbn,
          typeof book.volumeTitle === 'string' ? book.volumeTitle : null,
          book.volume !== undefined && book.volume !== null ? String(book.volume) : null,
          typeof book.edition === 'string' ? book.edition : null,
          formatBookAuthors(book),
        ],
        searchQuery,
      )
    }
    return items.filter((book) => matchesQuery(book))
  }, [items, searchQuery])

  const sortedItems = useMemo(() => {
    const copy = [...filteredItems]
    copy.sort((a, b) => {
      if (sortOption === 'series') {
        return compareBooksBySeriesAndVolume(a, b)
      }
      return getBookAddedTimestamp(b) - getBookAddedTimestamp(a)
    })
    return copy
  }, [filteredItems, sortOption])

  const isLoading = friendQuery.isLoading || libraryQuery.isLoading || wishlistQuery.isLoading
  const hasError = friendQuery.isError || libraryQuery.isError || wishlistQuery.isError

  if (isLoading) {
    return <Loader label="Chargement de la collection..." />
  }

  if (hasError || !friendQuery.data) {
    return (
      <section className="space-y-4">
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          Retour
        </button>
        <p className="text-sm text-rose-600">Impossible de charger la collection de cet ami.</p>
      </section>
    )
  }

  const friend = friendQuery.data

  return (
    <section className="space-y-6">
      <button
        type="button"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => navigate(-1)}
      >
        ← Retour
      </button>

      <header className="card flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800">
          <img
            src={`${ASSETS_PROFILE_BASE_URL}/${friend.id}.jpg`}
            alt={`Avatar de ${friend.firstName}`}
            onError={(event) => {
              const target = event.currentTarget
              if (target.dataset.attempt !== 'png') {
                target.src = `${ASSETS_PROFILE_BASE_URL}/${friend.id}.png`
                target.dataset.attempt = 'png'
              } else {
                target.src = '/placeholder-user.svg'
                target.dataset.attempt = 'final'
              }
            }}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {friend.firstName} {friend.lastName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Bibliothèque partagée via My BiblioConnect
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Livres possédés</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {friendStats.ownedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Genre préféré</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {friendStats.favoriteGenre || 'Non déterminé'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Auteur préféré</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {friendStats.favoriteAuthor || 'Non déterminé'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Séries en cours</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {friendStats.seriesInProgress}
          </p>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        <div className="relative w-full">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Rechercher un livre..."
            aria-label="Rechercher un livre dans cette bibliothèque"
          />
        </div>
        <div className="flex items-center gap-2">
          <SortDropdown
            value={filter}
            options={FILTERS}
            onChange={setFilter}
            ariaLabel="Filtrer les livres de cet ami"
            compact
            buttonClassName="h-11 w-11 justify-center gap-1 p-0"
            menuAlignmentClass="left-1/2 translate-x-[10%]"
            renderButtonContent={() => (
              <>
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-600 dark:text-slate-100" />
              </>
            )}
          />
          <SortDropdown
            value={sortOption}
            options={LIBRARY_SORT_OPTIONS}
            onChange={setSortOption}
            ariaLabel="Trier les livres de cet ami"
            compact
            buttonClassName="h-11 w-11 justify-center gap-1 p-0"
            renderButtonContent={() => (
              <>
                <ArrowsUpDownIcon className="h-5 w-5 text-slate-600 dark:text-slate-100" />
              </>
            )}
          />
          <button
            type="button"
            onClick={toggleViewMode}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={
              viewMode === 'cards'
                ? 'Basculer en vue liste'
                : 'Basculer en vue cartes'
            }
          >
            {viewMode === 'cards' ? (
              <ListBulletIcon className="h-5 w-5" />
            ) : (
              <Squares2X2Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === id
                  ? 'bg-primary text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Rechercher un livre..."
              aria-label="Rechercher un livre dans cette bibliothèque"
            />
          </div>
          <SortDropdown
            value={sortOption}
            options={LIBRARY_SORT_OPTIONS}
            onChange={setSortOption}
            placeholder="Trier"
          />
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {sortedItems.length} livre{sortedItems.length > 1 ? 's' : ''}
          </p>
          <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {LIBRARY_VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === mode.id
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedItems.length ? (
        viewMode === 'cards' ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((book, index) => (
              <BookSummaryCard key={`${book.id}-${book.status}-${index}`} book={book} status={book.status} />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl bg-white dark:bg-slate-900">
            {(() => {
              const showSeriesSections = viewMode === 'list' && sortOption === 'series'
              let previousInitial = null
              let hasRenderedBookRow = false
              let previousWasSeparator = false
              const rows = []
              sortedItems.forEach((book, index) => {
                const title = formatBookTitle(book) || 'Titre inconnu'
                const authors = formatBookAuthors(book) || 'Auteur inconnu'
                const statusLabel = book.status === 'wishlist' ? 'Souhaité' : 'Possédé'
                const badgeClass =
                  book.status === 'wishlist'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                const canNavigate = Boolean(book?.id)
                const sectionInitial = showSeriesSections ? getSeriesInitialLetter(book) : null
                const shouldRenderSection =
                  showSeriesSections && sectionInitial && sectionInitial !== previousInitial
                if (shouldRenderSection) {
                  previousInitial = sectionInitial
                  rows.push(
                    <div
                      key={`separator-${sectionInitial}-${book.id}-${index}`}
                      className="bg-slate-50 px-4 py-3 text-sm font-semibold uppercase tracking-[0.6em] text-slate-500 dark:bg-slate-800/70 dark:text-slate-200"
                    >
                      {sectionInitial}
                    </div>,
                  )
                  previousWasSeparator = true
                }
                const shouldShowBorder = hasRenderedBookRow && !previousWasSeparator
                rows.push(
                  <div
                    key={`book-${book.id}-${book.status}-${index}`}
                    className={`flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:flex-nowrap ${
                      shouldShowBorder ? 'border-t border-slate-200 dark:border-slate-800' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {canNavigate ? (
                        <Link
                          to={`/books/${book.id}`}
                          className="font-medium text-primary transition hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          {title}
                        </Link>
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
                      )}
                      <p className="text-sm text-slate-500 dark:text-slate-400">{authors}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>,
                )
                hasRenderedBookRow = true
                previousWasSeparator = false
              })
              return rows
            })()}
          </section>
        )
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {searchTerm.trim().length
            ? "Aucun livre ne correspond à votre recherche. Essayez un autre mot-clé ou changez de filtre."
            : 'Aucun livre dans cette catégorie.'}
        </p>
      )}
    </section>
  )
}

export default FriendCollection
