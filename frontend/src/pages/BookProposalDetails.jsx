import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { approveBookProposal, fetchBookProposalById, rejectBookProposal } from '../api/bookProposals'
import Loader from '../components/Loader.jsx'

const BookProposalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const proposalQuery = useQuery({
    queryKey: ['book-proposal', id],
    queryFn: () => fetchBookProposalById(id),
  })

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-primary">Détails de la proposition</h2>
          <dl className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
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

      {isPending && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
