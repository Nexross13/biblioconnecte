import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ArrowPathIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { UserMinusIcon } from '@heroicons/react/24/solid'
import { deleteFriend } from '../api/users'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'
import emptyFriendsIllustration from '../assets/components/img/ami.png'

const FriendList = ({ friends = [], isLoading = false, onViewLibrary }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [removingId, setRemovingId] = useState(null)

  const removeMutation = useMutation({
    mutationFn: (friendId) => deleteFriend({ userId: user.id, friendId }),
    onMutate: (friendId) => {
      setRemovingId(friendId)
    },
    onSuccess: () => {
      toast.success('Ami retiré')
      queryClient.invalidateQueries({ queryKey: ['friends', user.id] })
    },
    onError: () => toast.error("Impossible de supprimer l'ami"),
    onSettled: () => setRemovingId(null),
  })

  if (isLoading) {
    return <Loader label="Chargement des amis..." />
  }

  if (!friends.length) {
    return (
      <div className="flex items-center justify-center gap-6 text-slate-600 dark:text-slate-200 sm:gap-8">
        <div className="max-w-xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
            Pas encore d&apos;amis
          </p>
          <p className="text-lg font-semibold text-primary">Invitez vos proches pour partager vos lectures.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Envoyez vos premières invitations pour découvrir leurs bibliothèques, échanger vos coups de cœur et ne
            jamais manquer une nouvelle sortie.
          </p>
        </div>
        <img
          src={emptyFriendsIllustration}
          alt="Illustration aucun ami"
          className="w-44 shrink-0 sm:w-56 md:w-64"
        />
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
          <div className="mt-auto flex flex-wrap gap-2">
            {onViewLibrary && (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-primary dark:text-primary dark:hover:bg-primary/20 dark:focus:ring-offset-slate-900"
                onClick={() => onViewLibrary(friend)}
                aria-label={`Consulter la bibliothèque de ${friend.firstName}`}
                title="Voir la bibliothèque"
              >
                <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Consulter la bibliothèque</span>
              </button>
            )}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500 text-white transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60"
              onClick={() => removeMutation.mutate(friend.id)}
              disabled={removeMutation.isPending}
              aria-label={`Retirer ${friend.firstName} de vos amis`}
              title="Retirer des amis"
            >
              {removeMutation.isPending && removingId === friend.id ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <UserMinusIcon className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {removeMutation.isPending && removingId === friend.id ? 'Suppression en cours' : 'Retirer des amis'}
              </span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FriendList
