import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import FriendList from '../components/FriendList.jsx'
import Loader from '../components/Loader.jsx'
import { fetchFriends, fetchUsers, requestFriend } from '../api/users'
import useAuth from '../hooks/useAuth'

const Friends = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const friendsQuery = useQuery({
    queryKey: ['friends', user.id],
    queryFn: () => fetchFriends(user.id),
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const requestMutation = useMutation({
    mutationFn: (friendId) => requestFriend(friendId),
    onSuccess: () => {
      toast.success('Demande envoyée')
      queryClient.invalidateQueries({ queryKey: ['friends', user.id] })
    },
    onError: () => toast.error("Impossible d'envoyer la demande"),
  })

  const otherUsers = useMemo(() => {
    if (!usersQuery.data) return []
    return usersQuery.data.filter((candidate) => candidate.id !== user.id)
  }, [usersQuery.data, user.id])

  const friendIds = useMemo(
    () => new Set((friendsQuery.data || []).map((friend) => friend.id)),
    [friendsQuery.data],
  )

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">Mes amis</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Partagez vos bibliothèques et explorez celles de vos proches.
        </p>
      </header>

      <FriendList friends={friendsQuery.data || []} isLoading={friendsQuery.isLoading} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Inviter un membre</h2>
        {usersQuery.isLoading ? (
          <Loader label="Chargement des membres..." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherUsers.map((candidate) => {
              const isFriend = friendIds.has(candidate.id)
              return (
                <div key={candidate.id} className="card space-y-2">
                  <h3 className="text-base font-semibold text-primary">
                    {candidate.firstName} {candidate.lastName}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{candidate.email}</p>
                  <button
                    type="button"
                    className="btn w-full"
                    onClick={() => requestMutation.mutate(candidate.id)}
                    disabled={requestMutation.isPending || isFriend}
                  >
                    {isFriend
                      ? 'Déjà ami'
                      : requestMutation.isPending
                      ? 'Envoi...'
                      : 'Envoyer une demande'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default Friends
