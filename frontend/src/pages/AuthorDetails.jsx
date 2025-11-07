import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import Loader from '../components/Loader.jsx'
import BookCard from '../components/BookCard.jsx'
import { fetchAuthorById, fetchAuthorBooks } from '../api/authors'

const AuthorDetails = () => {
  const { id } = useParams()

  const authorQuery = useQuery({
    queryKey: ['author', id],
    queryFn: () => fetchAuthorById(id),
  })

  const booksQuery = useQuery({
    queryKey: ['author-books', id],
    queryFn: () => fetchAuthorBooks(id),
  })

  if (authorQuery.isLoading) {
    return <Loader label="Chargement de l'auteur..." />
  }

  if (authorQuery.isError || !authorQuery.data) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-primary">Auteur introuvable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Impossible de charger cet auteur. Il a peut-être été supprimé.
        </p>
      </section>
    )
  }

  const author = authorQuery.data
  const books = booksQuery.data ?? []
  const formattedName = [author.firstName, author.lastName].filter(Boolean).join(' ').trim()

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">{formattedName || 'Auteur'}</h1>
        {author.biography ? (
          <p className="text-base text-slate-600 dark:text-slate-300">{author.biography}</p>
        ) : (
          <p className="text-sm italic text-slate-400 dark:text-slate-500">
            Aucune biographie n’a encore été fournie pour cet auteur.
          </p>
        )}
      </header>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">Livres présents dans le catalogue</h2>
        {booksQuery.isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Chargement des livres…</p>
        ) : books.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books
              .slice()
              .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return dateB - dateA
              })
              .map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Aucun livre n’est encore associé à cet auteur.
          </p>
        )}
      </div>
    </section>
  )
}

export default AuthorDetails
