import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  approveBookProposal,
  fetchBookProposalById,
  rejectBookProposal,
  updateBookProposal,
} from '../api/bookProposals'
import Loader from '../components/Loader.jsx'
import EditableProposalField from '../components/EditableProposalField.jsx'
import useAuth from '../hooks/useAuth'
import { ASSETS_BOOKS_BASE_URL } from '../api/axios'

const PLACEHOLDER_COVER = '/placeholder-book.svg'
const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const parseOptionalText = (value) => {
  if (value === null || value === undefined) {
    return null
  }
  const normalized = String(value).trim()
  return normalized.length ? normalized : null
}

const parseRequiredText = (label) => (value) => {
  const normalized = String(value ?? '').trim()
  if (!normalized.length) {
    throw new Error(`${label} ne peut pas être vide`)
  }
  return normalized
}

const serializeListValue = (values) => (Array.isArray(values) && values.length ? values.join(', ') : '')

const parseListInput = (value) => {
  if (typeof value !== 'string') {
    return []
  }
  const normalized = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return Array.from(new Set(normalized))
}

const serializeDateValue = (value) => (typeof value === 'string' && value.length ? value.slice(0, 10) : '')

const parseDateInput = (value) => {
  if (value === null || value === undefined) {
    return null
  }
  const normalized = String(value).trim()
  if (!normalized.length) {
    return null
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error('Format attendu : AAAA-MM-JJ')
  }
  return normalized
}

const BookProposalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const proposalQuery = useQuery({
    queryKey: ['book-proposal', id],
    queryFn: () => fetchBookProposalById(id),
  })

  const [coverSrc, setCoverSrc] = useState(PLACEHOLDER_COVER)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [savingField, setSavingField] = useState(null)
  const proposal = proposalQuery.data ?? null
  const isPending = proposal?.status === 'pending'
  const isAdmin = user?.role === 'admin'
  const canEditProposal = Boolean(isAdmin && isPending)

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

  const updateMutation = useMutation({
    mutationFn: ({ payload }) => updateBookProposal(id, payload),
    onMutate: ({ fieldKey }) => {
      setSavingField(fieldKey)
    },
    onSuccess: async (_, variables) => {
      await invalidateLists()
      toast.success(variables?.successMessage || 'Champ mis à jour')
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || 'Impossible de mettre à jour cette proposition'
      toast.error(message)
    },
    onSettled: () => {
      setSavingField(null)
    },
  })

  const handleFieldSave = (fieldKey, value, options = {}) =>
    updateMutation.mutateAsync({
      fieldKey,
      payload: { [fieldKey]: value },
      successMessage: options.successMessage,
    })

  const isFieldSaving = (fieldKey) => updateMutation.isPending && savingField === fieldKey

  const coverCandidates = useMemo(() => {
    const candidates = []
    if (proposal?.coverImagePath) {
      const root = ASSETS_BOOKS_BASE_URL.replace(/\/assets\/books\/?$/, '')
      const normalized = proposal.coverImagePath.startsWith('/')
        ? proposal.coverImagePath
        : `/${proposal.coverImagePath}`
      candidates.push(`${root}${normalized}`)
    }
    if (proposal?.isbn) {
      COVER_EXTENSIONS.forEach((ext) => {
        candidates.push(`${ASSETS_BOOKS_BASE_URL}/${proposal.isbn}.${ext}`)
      })
    }
    return candidates
  }, [proposal?.coverImagePath, proposal?.isbn])

  useEffect(() => {
    if (!coverCandidates.length) {
      setCoverSrc(PLACEHOLDER_COVER)
      setCandidateIndex(0)
      return
    }
    setCoverSrc(coverCandidates[0])
    setCandidateIndex(0)
  }, [coverCandidates])

  if (proposalQuery.isLoading) {
    return <Loader label="Chargement de la proposition..." />
  }

  if (proposalQuery.isError || !proposal) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">Proposition introuvable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Cette proposition n’existe pas ou vous n’y avez pas accès.
        </p>
      </section>
    )
  }

  const submittedFullName = `${proposal.submittedBy?.firstName ?? 'Utilisateur'} ${
    proposal.submittedBy?.lastName ?? ''
  }`.trim()

  const releaseDateLabel = proposal.releaseDate
    ? (() => {
        const date = new Date(proposal.releaseDate)
        if (Number.isNaN(date.getTime())) {
          return proposal.releaseDate
        }
        return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
      })()
    : null

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
                  Titre
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.title}
                    placeholder="Titre non renseigné"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('title')}
                    onSave={(nextValue) =>
                      handleFieldSave('title', nextValue, { successMessage: 'Titre mis à jour' })
                    }
                    parseValue={parseRequiredText('Le titre')}
                    displayClassName="text-base font-semibold text-slate-700 dark:text-slate-100"
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Proposé par
                </dt>
                <dd>{submittedFullName || 'Utilisateur inconnu'}</dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  ISBN
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.isbn}
                    placeholder="Non renseigné"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('isbn')}
                    onSave={(nextValue) =>
                      handleFieldSave('isbn', nextValue, { successMessage: 'ISBN mis à jour' })
                    }
                    parseValue={parseOptionalText}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Édition
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.edition}
                    placeholder="Non renseignée"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('edition')}
                    onSave={(nextValue) =>
                      handleFieldSave('edition', nextValue, {
                        successMessage: 'Édition mise à jour',
                      })
                    }
                    parseValue={parseOptionalText}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Tome / Volume
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.volume}
                    placeholder="Non renseigné"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('volume')}
                    onSave={(nextValue) =>
                      handleFieldSave('volume', nextValue, { successMessage: 'Volume mis à jour' })
                    }
                    parseValue={parseOptionalText}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Titre du tome
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.volumeTitle}
                    placeholder="Non renseigné"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('volumeTitle')}
                    onSave={(nextValue) =>
                      handleFieldSave('volumeTitle', nextValue, {
                        successMessage: 'Titre du tome mis à jour',
                      })
                    }
                    parseValue={parseOptionalText}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Date de sortie
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.releaseDate}
                    placeholder="Aucune date renseignée"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('releaseDate')}
                    onSave={(nextValue) =>
                      handleFieldSave('releaseDate', nextValue, {
                        successMessage: 'Date de sortie mise à jour',
                      })
                    }
                    inputType="date"
                    serializeValue={serializeDateValue}
                    parseValue={parseDateInput}
                    displayValue={(_, fallback) =>
                      releaseDateLabel ? (
                        releaseDateLabel
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">{fallback}</span>
                      )
                    }
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Auteur(s)
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.authorNames ?? []}
                    placeholder="Aucun auteur indiqué"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('authorNames')}
                    onSave={(nextValue) =>
                      handleFieldSave('authorNames', nextValue, {
                        successMessage: 'Auteur(s) mis à jour',
                      })
                    }
                    serializeValue={serializeListValue}
                    parseValue={parseListInput}
                    helperText="Séparez les noms par une virgule"
                    displayValue={(names, fallback) =>
                      Array.isArray(names) && names.length ? (
                        names.join(', ')
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">{fallback}</span>
                      )
                    }
                  />
                </dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide text-xs text-slate-400 dark:text-slate-500">
                  Genre(s)
                </dt>
                <dd>
                  <EditableProposalField
                    value={proposal.genreNames ?? []}
                    placeholder="Aucun genre indiqué"
                    isEditable={canEditProposal}
                    isSaving={isFieldSaving('genreNames')}
                    onSave={(nextValue) =>
                      handleFieldSave('genreNames', nextValue, {
                        successMessage: 'Genre(s) mis à jour',
                      })
                    }
                    serializeValue={serializeListValue}
                    parseValue={parseListInput}
                    helperText="Séparez les genres par une virgule"
                    displayValue={(names, fallback) =>
                      Array.isArray(names) && names.length ? (
                        names.join(', ')
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">{fallback}</span>
                      )
                    }
                  />
                </dd>
              </div>
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
            <EditableProposalField
              value={proposal.summary}
              placeholder="Aucun résumé fourni pour cette proposition."
              isEditable={canEditProposal}
              isSaving={isFieldSaving('summary')}
              onSave={(nextValue) =>
                handleFieldSave('summary', nextValue, { successMessage: 'Résumé mis à jour' })
              }
              multiline
              parseValue={parseOptionalText}
              displayValue={(value, fallback) =>
                value ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                    {value}
                  </p>
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-500">{fallback}</span>
                )
              }
              displayClassName="w-full"
            />
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
