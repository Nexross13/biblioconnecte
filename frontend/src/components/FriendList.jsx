import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { deleteFriend } from '../api/users'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'

const FriendList = ({ friends = [], isLoading = false }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: (friendId) => deleteFriend({ userId: user.id, friendId }),
    onSuccess: () => {
      toast.success('Ami retiré')
      queryClient.invalidateQueries({ queryKey: ['friends', user.id] })
    },
    onError: () => toast.error("Impossible de supprimer l'ami"),
  })

  if (isLoading) {
    return <Loader label="Chargement des amis..." />
  }

  if (!friends.length) {
    return (
      <div className="card text-center text-sm text-slate-500 dark:text-slate-300">
        Vous n&apos;avez pas encore d&apos;amis. Invitez vos proches pour partager vos lectures.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <div key={friend.id} className="card flex flex-col gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-semibold text-primary">
              {friend.firstName} {friend.lastName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300">{friend.email}</p>
            {friend.acceptedAt && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Amis depuis le {new Date(friend.acceptedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          <div className="flex flex-1 justify-end">
            <button
              type="button"
              className="rounded-lg border border-rose-500 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              onClick={() => removeMutation.mutate(friend.id)}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Suppression...' : 'Retirer'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FriendList
