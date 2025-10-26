import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchBooks } from '../api/books'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import useAuth from '../hooks/useAuth'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState('')

  const booksQuery = useQuery({
    queryKey: ['books', search],
    queryFn: () => fetchBooks(search ? { search } : undefined),
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

  const libraryIds = useMemo(
    () => new Set((libraryQuery.data || []).map((item) => item.id)),
    [libraryQuery.data],
  )
  const wishlistIds = useMemo(
    () => new Set((wishlistQuery.data || []).map((item) => item.id)),
    [wishlistQuery.data],
  )

  return (
    <section className="space-y-8">
      <header className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-10 text-white shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Bienvenue sur BiblioConnecte</h1>
          <p className="mt-2 max-w-2xl text-sm md:text-base">
            Explorez la bibliothèque collaborative, ajoutez vos lectures, partagez-les avec vos amis
            et découvrez de nouvelles recommandations.
          </p>
        </div>
        <form
          className="w-full max-w-sm"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            setSearch(formData.get('search') || '')
          }}
        >
          <div className="flex rounded-lg bg-white/20 p-1 shadow-inner backdrop-blur">
            <input
              type="search"
              name="search"
              placeholder="Rechercher un livre, un auteur..."
              className="input flex-1 border-none bg-transparent text-white placeholder:text-white/70 focus:ring-white/50"
              defaultValue={search}
            />
            <button type="submit" className="btn bg-white text-primary hover:bg-slate-100">
              Rechercher
            </button>
          </div>
        </form>
      </header>

      {booksQuery.isLoading ? (
        <Loader label="Chargement du catalogue..." />
      ) : booksQuery.isError ? (
        <p className="text-center text-sm text-rose-600">
          Impossible de charger le catalogue. Veuillez réessayer plus tard.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {booksQuery.data?.books?.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              inLibrary={libraryIds.has(book.id)}
              inWishlist={wishlistIds.has(book.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default Home
