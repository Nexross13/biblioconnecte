import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Loader from '../components/Loader.jsx'
import {
  approveAuthorProposal,
  fetchAuthorProposalById,
  rejectAuthorProposal,
} from '../api/authorProposals'

const AuthorProposalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  const proposalQuery = useQuery({
    queryKey: ['author-proposal', id],
    queryFn: () => fetchAuthorProposalById(id),
  })

  const invalidateLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['author-proposal', id] }),
      queryClient.invalidateQueries({ queryKey: ['author-proposals'] }),
      queryClient.invalidateQueries({ queryKey: ['author-proposals', 'pending'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
    ])
  }

  const approveMutation = useMutation({
    mutationFn: () => approveAuthorProposal(id),
    onSuccess: async ({ proposal }) => {
      await invalidateLists()
      toast.success(`L'auteur ${proposal.firstName} ${proposal.lastName} a été approuvé.`)
      navigate('/dashboard')
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Impossible d'approuver cette proposition pour le moment."
      toast.error(message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectAuthorProposal(id, rejectionReason.trim() ? { reason: rejectionReason } : {}),
    onSuccess: async ({ proposal }) => {
      await invalidateLists()
      toast.success(`La proposition pour ${proposal.firstName} ${proposal.lastName} a été rejetée.`)
      setIsRejectModalOpen(false)
      setRejectionReason('')
      navigate('/dashboard')
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || 'Impossible de rejeter cette proposition pour le moment.'
      toast.error(message)
    },
  })

  if (proposalQuery.isLoading) {
    return <Loader label="Chargement de la proposition..." />
  }

  const proposal = proposalQuery.data

  if (proposalQuery.isError || !proposal) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">Proposition introuvable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Cette proposition d’auteur n’existe pas ou vous n’y avez pas accès.
        </p>
      </section>
    )
  }

  const submittedFullName = `${proposal.submittedBy?.firstName ?? 'Utilisateur'} ${
    proposal.submittedBy?.lastName ?? ''
  }`.trim()
  const isPending = proposal.status === 'pending'

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">
          {proposal.firstName} {proposal.lastName}
        </h1>
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

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-start">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-primary">Biographie proposée</h2>
          {proposal.biography ? (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-200">
              {proposal.biography}
            </p>
          ) : (
            <p className="text-sm italic text-slate-500 dark:text-slate-300">
              Aucune biographie n’a été fournie.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Statut
              </p>
              <p className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                {proposal.status === 'pending' && 'En attente'}
                {proposal.status === 'approved' && 'Approuvé'}
                {proposal.status === 'rejected' && 'Rejeté'}
              </p>
            </div>
            {proposal.decidedBy && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Décidé par
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                  {proposal.decidedBy.firstName} {proposal.decidedBy.lastName}
                </p>
              </div>
            )}
          </div>
          {proposal.rejectionReason && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-100">
              <p className="font-semibold">Motif du refus</p>
              <p>{proposal.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Proposé par
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{submittedFullName}</p>
          </div>
          <div className="flex flex-col gap-3">
            {isPending ? (
              <>
                <button
                  type="button"
                  className="btn w-full"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isLoading || rejectMutation.isLoading}
                >
                  {approveMutation.isLoading ? 'Validation...' : "Accepter l'auteur"}
                </button>
                <button
                  type="button"
                  className="btn-danger w-full"
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={approveMutation.isLoading || rejectMutation.isLoading}
                >
                  Refuser
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Cette proposition a déjà été traitée.
              </p>
            )}
          </div>
        </div>
      </div>
      {isPending && isRejectModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-primary">Motif du refus</h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Ce message sera envoyé à l’auteur de la proposition avec l’email récapitulatif.
              </p>
            </div>
            <textarea
              rows={5}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="input min-h-[140px]"
              placeholder="Expliquez les ajustements attendus…"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-danger sm:w-auto"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isLoading}
              >
                {rejectMutation.isLoading ? 'Rejet en cours...' : 'Confirmer le refus'}
              </button>
              <button
                type="button"
                className="btn-secondary sm:w-auto"
                onClick={() => {
                  setIsRejectModalOpen(false)
                  setRejectionReason('')
                }}
                disabled={rejectMutation.isLoading}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AuthorProposalDetails
