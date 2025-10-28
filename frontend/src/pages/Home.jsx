import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchBooks } from '../api/books'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import { fetchHighlights } from '../api/stats'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'

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

  const libraryIds = useMemo(
    () => new Set((libraryQuery.data || []).map((item) => item.id)),
    [libraryQuery.data],
  )
  const wishlistIds = useMemo(
    () => new Set((wishlistQuery.data || []).map((item) => item.id)),
    [wishlistQuery.data],
  )

  const hero = (
    <header className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-10 text-white shadow-lg md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Bienvenue sur BiblioConnecte</h1>
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
            className="btn bg-white text-primary hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-primary/60"
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
  )

  if (!isAuthenticated) {
    return (
      <section className="space-y-8">
        {hero}
        <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
          Connectez-vous ou créez un compte pour découvrir les lecteurs les plus actifs, les livres
          les mieux notés et effectuer des recherches dans la base de données.
        </div>
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
              <div className="card space-y-2">
                <h2 className="text-xl font-semibold text-primary">Lecteur le plus actif</h2>
                {highlightsQuery.data?.topReader ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-100">
                      {highlightsQuery.data.topReader.user.firstName}{' '}
                      {highlightsQuery.data.topReader.user.lastName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {highlightsQuery.data.topReader.totalBooks} livres enregistrés dans sa
                      bibliothèque.
                    </p>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                      {highlightsQuery.data.topReader.user.email}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Aucun lecteur mis en avant pour le moment.
                  </p>
                )}
              </div>

              <div className="card space-y-2">
                <h2 className="text-xl font-semibold text-primary">Livre le mieux noté</h2>
                {highlightsQuery.data?.topRatedBook ? (
                  <div className="space-y-3">
                    <Link
                      to={`/books/${highlightsQuery.data.topRatedBook.book.id}`}
                      className="text-lg font-semibold text-slate-700 hover:text-primary dark:text-slate-100"
                    >
                      {highlightsQuery.data.topRatedBook.book.title}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Note moyenne :
                      <span className="ml-1 font-semibold text-primary">
                        ⭐
                        {highlightsQuery.data.topRatedBook.averageRating?.toFixed
                          ? ` ${highlightsQuery.data.topRatedBook.averageRating.toFixed(2)}`
                          : ` ${highlightsQuery.data.topRatedBook.averageRating}`}
                      </span>
                      ({highlightsQuery.data.topRatedBook.totalReviews} avis)
                    </p>
                    {highlightsQuery.data.topRatedBook.book.summary && (
                      <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-3">
                        {highlightsQuery.data.topRatedBook.book.summary}
                      </p>
                    )}
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
                <h2 className="text-xl font-semibold text-primary">Dernières parutions</h2>
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
