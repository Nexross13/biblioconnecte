import { useQuery } from '@tanstack/react-query'
import BookCard from '../components/BookCard.jsx'
import Loader from '../components/Loader.jsx'
import { fetchWishlist } from '../api/wishlist'

const Wishlist = () => {
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })

  if (wishlistQuery.isLoading) {
    return <Loader label="Chargement de votre liste de souhaits..." />
  }

  if (wishlistQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger votre liste de souhaits. Veuillez réessayer plus tard.
      </p>
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary">Mes souhaits</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Gardez une trace des ouvrages que vous souhaitez découvrir.
        </p>
      </header>
      {wishlistQuery.data.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
          Votre liste de souhaits est vide. Ajoutez des titres depuis le catalogue.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistQuery.data.map((book) => (
            <BookCard key={book.id} book={book} inWishlist />
          ))}
        </div>
      )}
    </section>
  )
}

export default Wishlist
