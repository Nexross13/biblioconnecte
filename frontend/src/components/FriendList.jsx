import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { deleteFriend } from '../api/users'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'

const FriendList = ({ friends = [], isLoading = false, onViewLibrary }) => {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {friends.map((friend) => (
        <div key={friend.id} className="card flex h-full flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800">
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
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary">
                {friend.firstName} {friend.lastName}
              </h3>
              {friend.acceptedAt && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Amis depuis le {new Date(friend.acceptedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {onViewLibrary && (
              <button
                type="button"
                className="btn"
                onClick={() => onViewLibrary(friend)}
              >
                Consulter la bibliothèque
              </button>
            )}
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
