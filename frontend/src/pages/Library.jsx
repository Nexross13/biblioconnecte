import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import formatBookTitle from '../utils/formatBookTitle'

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

    const query = searchTerm.trim().toLowerCase()
    if (!query) {
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

      const haystack = [
        formatBookTitle(book),
        book.summary,
        book.isbn,
        authorTokens.join(' '),
        genreTokens.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    }

    return subset.filter(({ book }) => matchesQuery(book))
  }, [activeFilter, combinedBooks, searchTerm])

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

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="relative w-full sm:w-auto">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Rechercher un livre..."
            aria-label="Rechercher un livre dans votre bibliothèque"
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
          {searchTerm.trim().length
            ? "Aucun livre ne correspond à votre recherche. Essayez un autre mot-clé ou changez de filtre."
            : emptyMessages[activeFilter]}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map(({ book, inLibrary, inWishlist }) => (
            <BookCard key={book.id} book={book} inLibrary={inLibrary} inWishlist={inWishlist} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Library
