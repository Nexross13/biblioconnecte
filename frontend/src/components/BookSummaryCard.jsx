import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'
import formatDate from '../utils/formatDate'
import formatBookTitle from '../utils/formatBookTitle'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const BookSummaryCard = ({ book, status }) => {
  const coverCandidates = useMemo(() => {
    if (!book?.isbn) {
      return []
    }
    return COVER_EXTENSIONS.map((ext) => `${ASSETS_BOOKS_BASE_URL}/${book.isbn}.${ext}`)
  }, [book?.isbn])

  const [coverSrc, setCoverSrc] = useState(() => coverCandidates[0] || PLACEHOLDER_COVER)
  const [candidateIndex, setCandidateIndex] = useState(0)

  useEffect(() => {
    if (!coverCandidates.length) {
      setCoverSrc(PLACEHOLDER_COVER)
      setCandidateIndex(0)
      return
    }
    setCoverSrc(coverCandidates[0])
    setCandidateIndex(0)
  }, [coverCandidates])

  const statusLabel = status === 'wishlist' ? 'Souhaité' : 'Possédé'
  const statusClass =
    status === 'wishlist'
      ? 'bg-secondary/10 text-secondary'
      : 'bg-primary/10 text-primary'
  const displayTitle = formatBookTitle(book)

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
        <img
          src={coverSrc}
          alt={`Couverture de ${displayTitle || 'livre'}`}
          onError={(event) => {
            if (candidateIndex < coverCandidates.length - 1) {
              const nextIndex = candidateIndex + 1
              setCandidateIndex(nextIndex)
              setCoverSrc(coverCandidates[nextIndex])
              return
            }
            event.currentTarget.src = PLACEHOLDER_COVER
          }}
          loading="lazy"
          className="h-48 w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-primary">{displayTitle}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        {book.summary && (
          <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-3">{book.summary}</p>
        )}
        {book.addedAt && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Ajouté le {formatDate(book.addedAt)}
          </p>
        )}
      </div>

      <div className="mt-auto">
        <Link to={`/books/${book.id}`} className="btn w-full text-center">
          Voir les détails
        </Link>
      </div>
    </article>
  )
}

export default BookSummaryCard
