import { useQuery } from '@tanstack/react-query'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchLibrary } from '../api/library'

const Library = () => {
  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
  })

  if (libraryQuery.isLoading) {
    return <Loader label="Chargement de votre bibliothèque..." />
  }

  if (libraryQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger votre bibliothèque. Veuillez réessayer plus tard.
      </p>
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary">Ma bibliothèque</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Retrouvez vos lectures actuelles et passées.
        </p>
      </header>
      {libraryQuery.data.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
          Aucun livre dans votre bibliothèque. Utilisez le catalogue pour ajouter vos lectures
          favorites.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {libraryQuery.data.map((book) => (
            <BookCard key={book.id} book={book} inLibrary />
          ))}
        </div>
      )}
    </section>
  )
}

export default Library
