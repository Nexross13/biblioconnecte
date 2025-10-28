import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { approveBookProposal, fetchBookProposalById, rejectBookProposal } from '../api/bookProposals'
import Loader from '../components/Loader.jsx'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const BookProposalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const proposalQuery = useQuery({
    queryKey: ['book-proposal', id],
    queryFn: () => fetchBookProposalById(id),
  })

  const [coverSrc, setCoverSrc] = useState(PLACEHOLDER_COVER)
  const [candidateIndex, setCandidateIndex] = useState(0)

  const invalidateLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['book-proposal', id] }),
      queryClient.invalidateQueries({ queryKey: ['book-proposals'] }),
      queryClient.invalidateQueries({ queryKey: ['book-proposals', 'pending'] }),
    ])
  }

  const approveMutation = useMutation({
    mutationFn: () => approveBookProposal(id),
    onSuccess: async ({ proposal }) => {
      await invalidateLists()
      toast.success(`Le livre « ${proposal.title} » a été validé.`)
      navigate('/dashboard')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Impossible de valider la proposition'
      toast.error(message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectBookProposal(id),
    onSuccess: async ({ proposal }) => {
      await invalidateLists()
      toast.success(`La proposition « ${proposal.title} » a été rejetée.`)
      navigate('/dashboard')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Impossible de rejeter la proposition'
      toast.error(message)
    },
  })

  if (proposalQuery.isLoading) {
    return <Loader label="Chargement de la proposition..." />
  }

  if (proposalQuery.isError || !proposalQuery.data) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">Proposition introuvable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Cette proposition n’existe pas ou vous n’y avez pas accès.
        </p>
      </section>
    )
  }

  const proposal = proposalQuery.data
  const isPending = proposal.status === 'pending'
  const submittedFullName = `${proposal.submittedBy?.firstName ?? 'Utilisateur'} ${
    proposal.submittedBy?.lastName ?? ''
  }`.trim()

  const coverCandidates = useMemo(() => {
    const candidates = []
    if (proposal.coverImagePath) {
      const normalized = proposal.coverImagePath.startsWith('/')
        ? proposal.coverImagePath
        : `/${proposal.coverImagePath}`
      candidates.push(normalized)
    }
    if (proposal.isbn) {
      COVER_EXTENSIONS.forEach((ext) => {
        candidates.push(`${ASSETS_BOOKS_BASE_URL}/${proposal.isbn}.${ext}`)
      })
    }
    return candidates
  }, [proposal.coverImagePath, proposal.isbn])

  useEffect(() => {
    if (!coverCandidates.length) {
      setCoverSrc(PLACEHOLDER_COVER)
      setCandidateIndex(0)
      return
    }
    setCoverSrc(coverCandidates[0])
    setCandidateIndex(0)
  }, [coverCandidates])

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">{proposal.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Soumis par {submittedFullName}{' '}
          {proposal.submittedAt && (
            <>
              le{' '}
              <span className="font-medium">
                {new Date(proposal.submittedAt).toLocaleString('fr-FR')}
              </span>
            </>
          )}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="text-lg font-semibold text-primary">Détails de la proposition</h2>
            <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Proposé par
                </dt>
                <dd>{submittedFullName || 'Utilisateur inconnu'}</dd>
              </div>
              {proposal.isbn && (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    ISBN
                  </dt>
                  <dd>{proposal.isbn}</dd>
                </div>
              )}
              {proposal.edition && (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Édition
                  </dt>
                  <dd>{proposal.edition}</dd>
                </div>
              )}
              {proposal.volume && (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Tome / Volume
                  </dt>
                  <dd>{proposal.volume}</dd>
                </div>
              )}
              {proposal.authorNames?.length ? (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Auteur(s)
                  </dt>
                  <dd>{proposal.authorNames.join(', ')}</dd>
                </div>
              ) : null}
              {proposal.genreNames?.length ? (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Genre(s)
                  </dt>
                  <dd>{proposal.genreNames.join(', ')}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Statut actuel
                </dt>
                <dd className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  {proposal.status === 'pending' && 'En attente'}
                  {proposal.status === 'approved' && 'Approuvé'}
                  {proposal.status === 'rejected' && 'Rejeté'}
                </dd>
              </div>
              {proposal.decidedBy && (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Décidé par
                  </dt>
                  <dd>
                    {proposal.decidedBy.firstName} {proposal.decidedBy.lastName} –{' '}
                    {proposal.decidedAt
                      ? new Date(proposal.decidedAt).toLocaleString('fr-FR')
                      : 'Date inconnue'}
                  </dd>
                </div>
              )}
              {proposal.rejectionReason && (
                <div>
                  <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                    Motif du refus
                  </dt>
                  <dd>{proposal.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card space-y-2">
            <h2 className="text-lg font-semibold text-primary">Résumé</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-200">
              {proposal.summary || 'Aucun résumé fourni pour cette proposition.'}
            </p>
          </div>
        </div>

        <div className="card h-full overflow-hidden border border-slate-200 p-0 shadow-md shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800/70 dark:shadow-black/30">
          <img
            src={coverSrc}
            alt={`Couverture de ${proposal.title}`}
            onError={(event) => {
              if (candidateIndex < coverCandidates.length - 1) {
                const nextIndex = candidateIndex + 1
                setCandidateIndex(nextIndex)
                setCoverSrc(coverCandidates[nextIndex])
                return
              }
              event.currentTarget.src = PLACEHOLDER_COVER
            }}
            className="h-full w-full object-contain bg-slate-100 dark:bg-slate-900 md:h-[420px]"
          />
        </div>
      </div>

      {isPending && (
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending ? 'Validation en cours...' : 'Valider la proposition'}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => rejectMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejet en cours...' : 'Rejeter la proposition'}
          </button>
        </div>
      )}
    </section>
  )
}

export default BookProposalDetails
