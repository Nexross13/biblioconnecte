import { useQuery } from '@tanstack/react-query'
import { fetchBooks } from '../api/books'
import { fetchLibrary } from '../api/library'
import { fetchWishlist } from '../api/wishlist'
import { fetchFriends } from '../api/users'
import useAuth from '../hooks/useAuth'
import Loader from '../components/Loader.jsx'
import getAverageRating from '../utils/getAverageRating'

const Dashboard = () => {
  const { user } = useAuth()

  const booksQuery = useQuery({
    queryKey: ['books-dashboard'],
    queryFn: () => fetchBooks(),
  })
  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
  })
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })
  const friendsQuery = useQuery({
    queryKey: ['friends', user.id],
    queryFn: () => fetchFriends(user.id),
  })

  const isLoading =
    booksQuery.isLoading ||
    libraryQuery.isLoading ||
    wishlistQuery.isLoading ||
    friendsQuery.isLoading

  if (isLoading) {
    return <Loader label="Chargement du tableau de bord..." />
  }

  const stats = [
    {
      label: 'Livres dans ma bibliothèque',
      value: libraryQuery.data?.length ?? 0,
    },
    {
      label: 'Livres dans ma wishlist',
      value: wishlistQuery.data?.length ?? 0,
    },
    {
      label: 'Amis connectés',
      value: friendsQuery.data?.length ?? 0,
    },
    {
      label: 'Titres disponibles dans le catalogue',
      value: booksQuery.data?.books?.length ?? 0,
    },
  ]

  const ratings = booksQuery.data?.books
    ?.map((book) => book.reviews)
    ?.flat()
    ?.filter(Boolean)

  const averageRating = getAverageRating(ratings)

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Tableau de bord</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Une vue synthétique de vos activités de lecture.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">{stat.value}</p>
          </div>
        ))}
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Note moyenne globale
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {averageRating ? averageRating.toFixed(2) : 'N/A'}
          </p>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
