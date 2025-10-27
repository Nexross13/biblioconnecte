import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserById, fetchUserLibraryById, fetchUserWishlistById } from '../api/users'
import Loader from '../components/Loader.jsx'
import BookSummaryCard from '../components/BookSummaryCard.jsx'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'library', label: 'Possédé' },
  { key: 'wishlist', label: 'Souhaits' },
]

const FriendCollection = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const friendId = Number(id)
  const initialFilter = location.state?.initialFilter ?? 'all'
  const [filter, setFilter] = useState(initialFilter)

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
            Bibliothèque partagée via BiblioConnecte
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === key
                  ? key === 'wishlist'
                    ? 'bg-secondary text-white'
                    : 'bg-primary text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200'
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {items.length} livre{items.length > 1 ? 's' : ''}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length ? (
          items.map((book, index) => (
            <BookSummaryCard key={`${book.id}-${book.status}-${index}`} book={book} status={book.status} />
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Aucun livre dans cette catégorie.
          </p>
        )}
      </section>
    </section>
  )
}

export default FriendCollection
