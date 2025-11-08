import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import FriendList from '../components/FriendList.jsx'
import Loader from '../components/Loader.jsx'
import {
  fetchFriends,
  fetchFriendRequests,
  fetchUsers,
  requestFriend,
  acceptFriend,
  rejectFriendRequest,
} from '../api/users'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'
import useAuth from '../hooks/useAuth'

const Friends = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const friendsQuery = useQuery({
    queryKey: ['friends', user.id],
    queryFn: () => fetchFriends(user.id),
  })

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests', user.id],
    queryFn: () => fetchFriendRequests(user.id),
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const [pendingTargets, setPendingTargets] = useState(() => new Set())
  const [activeTarget, setActiveTarget] = useState(null)

  const sendRequestMutation = useMutation({
    mutationFn: (targetId) => requestFriend(targetId),
    onMutate: (targetId) => {
      setActiveTarget(targetId)
      setPendingTargets((prev) => {
        const next = new Set(prev)
        next.add(targetId)
        return next
      })
    },
    onSuccess: (_, targetId) => {
      toast.success('Demande envoyée')
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user.id] })
      setPendingTargets((prev) => {
        const next = new Set(prev)
        next.add(targetId)
        return next
      })
    },
    onError: (_, targetId) => {
      toast.error("Impossible d'envoyer la demande")
      setPendingTargets((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    },
    onSettled: () => {
      setActiveTarget(null)
    },
  })

  const acceptRequestMutation = useMutation({
    mutationFn: (requesterId) => acceptFriend({ userId: user.id, friendId: requesterId }),
    onSuccess: () => {
      toast.success('Demande acceptée')
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user.id] })
      queryClient.invalidateQueries({ queryKey: ['friends', user.id] })
    },
    onError: () => toast.error("Impossible d'accepter la demande"),
  })

  const rejectRequestMutation = useMutation({
    mutationFn: (requesterId) => rejectFriendRequest({ userId: user.id, friendId: requesterId }),
    onSuccess: () => {
      toast.success('Demande refusée')
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user.id] })
    },
    onError: () => toast.error('Impossible de refuser la demande'),
  })

  const friendsIds = useMemo(
    () => new Set((friendsQuery.data || []).map((friend) => friend.id)),
    [friendsQuery.data],
  )

  const filteredCandidates = useMemo(() => {
    if (!usersQuery.data) return []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []
    return usersQuery.data.filter((candidate) => {
      if (candidate.id === user.id) return false
      const emailMatch = candidate.email.toLowerCase().includes(term)
      const loginMatch = (candidate.login?.toLowerCase() || '').includes(term)
      return emailMatch || loginMatch
    })
  }, [usersQuery.data, user.id, searchTerm])

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mes amis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Partagez vos bibliothèques et explorez celles de vos proches.
          </p>
        </div>
        <div className="relative max-w-md">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un profil par login ou email"
            className="input"
          />
        </div>
      </header>

      {searchTerm.trim() && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Résultats de recherche</h2>
          {usersQuery.isLoading ? (
            <Loader label="Recherche de membres..." />
          ) : filteredCandidates.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCandidates.map((candidate) => {
                const alreadyFriend = friendsIds.has(candidate.id)
                const pending = pendingTargets.has(candidate.id)
                const isActive = activeTarget === candidate.id && sendRequestMutation.isPending

                return (
                  <div key={candidate.id} className="card flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800">
                      <img
                        src={`${ASSETS_PROFILE_BASE_URL}/${candidate.id}.jpg`}
                        alt={`Avatar de ${candidate.firstName}`}
                        onError={(event) => {
                          const target = event.currentTarget
                          if (target.dataset.attempt !== 'png') {
                            target.src = `${ASSETS_PROFILE_BASE_URL}/${candidate.id}.png`
                            target.dataset.attempt = 'png'
                          } else {
                            target.src = '/placeholder-user.svg'
                            target.dataset.attempt = 'final'
                          }
                        }}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-primary">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      {candidate.login && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">@{candidate.login}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => sendRequestMutation.mutate(candidate.id)}
                      disabled={alreadyFriend || pending}
                    >
                      {alreadyFriend
                        ? 'Déjà ami'
                        : pending
                        ? isActive
                          ? 'Envoi...'
                          : 'Demande en attente'
                        : 'Envoyer une demande'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Aucun membre ne correspond à cette recherche.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Demandes reçues</h2>
        {friendRequestsQuery.isLoading ? (
          <Loader label="Chargement des demandes..." />
        ) : friendRequestsQuery.data?.length ? (
          <div className="space-y-3">
            {friendRequestsQuery.data.map((request) => (
              <div
                key={request.requesterId}
                className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={`${ASSETS_PROFILE_BASE_URL}/${request.requesterId}.jpg`}
                      alt={`Avatar de ${request.firstName}`}
                      onError={(event) => {
                        const target = event.currentTarget
                        if (target.dataset.attempt !== 'png') {
                          target.src = `${ASSETS_PROFILE_BASE_URL}/${request.requesterId}.png`
                          target.dataset.attempt = 'png'
                        } else {
                          target.src = '/placeholder-user.svg'
                          target.dataset.attempt = 'final'
                        }
                      }}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-primary">
                      {request.firstName} {request.lastName}
                    </h3>
                    {request.requestedAt && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Demande envoyée le {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => acceptRequestMutation.mutate(request.requesterId)}
                    disabled={acceptRequestMutation.isPending}
                  >
                    {acceptRequestMutation.isPending ? 'En cours...' : 'Accepter'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    onClick={() => rejectRequestMutation.mutate(request.requesterId)}
                    disabled={rejectRequestMutation.isPending}
                  >
                    {rejectRequestMutation.isPending ? 'Refus...' : 'Refuser'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Aucune demande en attente pour le moment.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Mes amis</h2>
        <FriendList
          friends={friendsQuery.data || []}
          isLoading={friendsQuery.isLoading}
          onViewLibrary={(friend) =>
            navigate(`/friends/${friend.id}/collection`, {
              state: { friend, initialFilter: 'library' },
            })
          }
          onViewWishlist={(friend) =>
            navigate(`/friends/${friend.id}/collection`, {
              state: { friend, initialFilter: 'wishlist' },
            })
          }
        />
      </section>

    </section>
  )
}

export default Friends
