import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDownIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { AdjustmentsHorizontalIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import formatBookTitle from '../utils/formatBookTitle'
import formatBookAuthors from '../utils/formatBookAuthors'
import { readCookie, writeCookie } from '../utils/cookies'
import { LIBRARY_VIEW_COOKIE, LIBRARY_VIEW_MODES } from '../constants/libraryView'
import { LIBRARY_SORT_OPTIONS, DEFAULT_LIBRARY_SORT } from '../constants/librarySort'
import { compareBooksBySeriesAndVolume, getBookAddedTimestamp } from '../utils/bookSorting'
import SortDropdown from '../components/SortDropdown.jsx'
import { buildSearchQuery, matchesSearchQuery } from '../utils/search-utils'

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'owned', label: 'Possédé' },
  { id: 'wishlist', label: 'Souhaité' },
]

const Library = () => {
  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
  })
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })
  const [activeFilter, setActiveFilter] = useState('all')
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

  const combinedBooks = useMemo(() => {
    const libraryBooks = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
    const wishlistBooks = Array.isArray(wishlistQuery.data) ? wishlistQuery.data : []
    const map = new Map()

    libraryBooks.forEach((book) => {
      map.set(book.id, {
        book,
        inLibrary: true,
        inWishlist: false,
      })
    })

    wishlistBooks.forEach((book) => {
      const existing = map.get(book.id)
      if (existing) {
        map.set(book.id, {
          book: existing.book,
          inLibrary: true,
          inWishlist: true,
        })
      } else {
        map.set(book.id, {
          book,
          inLibrary: false,
          inWishlist: true,
        })
      }
    })

    return Array.from(map.values())
  }, [libraryQuery.data, wishlistQuery.data])

  const searchQuery = useMemo(() => buildSearchQuery(searchTerm), [searchTerm])

  const filteredBooks = useMemo(() => {
    let subset = combinedBooks

    switch (activeFilter) {
      case 'owned':
        subset = combinedBooks.filter((entry) => entry.inLibrary)
        break
      case 'wishlist':
        subset = combinedBooks.filter((entry) => entry.inWishlist)
        break
      default:
        subset = combinedBooks
    }

    if (!searchQuery) {
      return subset
    }

    const matchesQuery = (book) => {
      const authorTokens = Array.isArray(book.authors)
        ? book.authors
            .map((author) => [author.firstName, author.lastName].filter(Boolean).join(' ').trim())
            .filter(Boolean)
        : Array.isArray(book.authorNames)
        ? book.authorNames
        : []
      const genreTokens = Array.isArray(book.genres)
        ? book.genres.map((genre) => genre.name).filter(Boolean)
        : Array.isArray(book.genreNames)
        ? book.genreNames
        : []

      return matchesSearchQuery(
        [
          formatBookTitle(book),
          book.summary,
          book.isbn,
          typeof book.volumeTitle === 'string' ? book.volumeTitle : null,
          book.volume !== undefined && book.volume !== null ? String(book.volume) : null,
          typeof book.edition === 'string' ? book.edition : null,
          authorTokens.join(' '),
          genreTokens.join(' '),
        ],
        searchQuery,
      )
    }

    return subset.filter(({ book }) => matchesQuery(book))
  }, [activeFilter, combinedBooks, searchQuery])

  const sortedBooks = useMemo(() => {
    const copy = [...filteredBooks]
    copy.sort((a, b) => {
      if (sortOption === 'series') {
        return compareBooksBySeriesAndVolume(a.book, b.book)
      }
      return getBookAddedTimestamp(b.book) - getBookAddedTimestamp(a.book)
    })
    return copy
  }, [filteredBooks, sortOption])

  if (libraryQuery.isLoading || wishlistQuery.isLoading) {
    return <Loader label="Chargement de votre bibliothèque..." />
  }

  if (libraryQuery.isError || wishlistQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger votre bibliothèque. Veuillez réessayer plus tard.
      </p>
    )
  }

  const emptyMessages = {
    all: "Aucun livre dans votre bibliothèque ou vos souhaits pour le moment.",
    owned:
      "Vous n'avez pas encore de livres enregistrés comme possédés. Ajoutez-en depuis le catalogue.",
    wishlist:
      'Votre liste de souhaits est vide. Ajoutez les titres qui vous intéressent depuis le catalogue.',
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary">Ma bibliothèque</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Retrouvez vos lectures, vos possessions et vos prochaines envies.
        </p>
      </header>

      <div className="space-y-3 sm:hidden">
        <div className="relative w-full">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Rechercher un livre..."
            aria-label="Rechercher un livre dans votre bibliothèque"
          />
        </div>
        <div className="flex items-center gap-2">
          <SortDropdown
            value={activeFilter}
            options={FILTERS}
            onChange={setActiveFilter}
            ariaLabel="Filtrer vos livres"
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
            ariaLabel="Trier vos livres"
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
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? 'bg-primary text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label}
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
              aria-label="Rechercher un livre dans votre bibliothèque"
            />
          </div>
          <SortDropdown
            value={sortOption}
            options={LIBRARY_SORT_OPTIONS}
            onChange={setSortOption}
            placeholder="Trier"
          />
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

      {sortedBooks.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
          {searchTerm.trim().length
            ? "Aucun livre ne correspond à votre recherche. Essayez un autre mot-clé ou changez de filtre."
            : emptyMessages[activeFilter]}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBooks.map(({ book, inLibrary, inWishlist }) => (
            <BookCard key={book.id} book={book} inLibrary={inLibrary} inWishlist={inWishlist} />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {sortedBooks.map(({ book, inLibrary, inWishlist }) => {
            const title = formatBookTitle(book) || 'Titre inconnu'
            const authors = formatBookAuthors(book) || 'Auteur inconnu'
            const canNavigate = Boolean(book?.id)
            return (
              <div
                key={book.id}
                className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:flex-nowrap"
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {inLibrary && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                      Possédé
                    </span>
                  )}
                  {inWishlist && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      Souhaité
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Library
