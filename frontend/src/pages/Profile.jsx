import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { fetchUserById, updateProfile } from '../api/users'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'
import Loader from '../components/Loader.jsx'
import { ASSETS_PROFILE_BASE_URL } from '../api/axios'
import EditProfileModal from '../components/EditProfileModal.jsx'

const PLACEHOLDER_AVATAR = '/placeholder-user.svg'
const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const Profile = () => {
  const { user } = useAuth()
  const userQuery = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => fetchUserById(user.id),
    enabled: Boolean(user?.id),
  })

  const [isEditing, setIsEditing] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [avatarCandidateIndex, setAvatarCandidateIndex] = useState(0)
  const [avatarSrc, setAvatarSrc] = useState(PLACEHOLDER_AVATAR)

  const avatarCandidates = useMemo(() => {
    if (!userQuery.data?.id) {
      return []
    }
    return AVATAR_EXTENSIONS.map(
      (extension) => `${ASSETS_PROFILE_BASE_URL}/${userQuery.data.id}.${extension}?v=${avatarVersion}`,
    )
  }, [userQuery.data?.id, avatarVersion])

  useEffect(() => {
    if (!avatarCandidates.length) {
      setAvatarSrc(PLACEHOLDER_AVATAR)
      setAvatarCandidateIndex(0)
      return
    }
    setAvatarCandidateIndex(0)
    setAvatarSrc(avatarCandidates[0])
  }, [avatarCandidates])

  const roleBadge = useMemo(() => {
    const role = userQuery.data?.role
    if (!role || role === 'user') {
      return null
    }
    return {
      label: role === 'admin' ? 'Administrateur' : 'Modérateur',
      className:
        role === 'admin'
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
    }
  }, [userQuery.data?.role])

  if (userQuery.isLoading) {
    return <Loader label="Chargement du profil..." />
  }

  if (userQuery.isError) {
    return (
      <p className="text-center text-sm text-rose-600">
        Impossible de charger votre profil. Veuillez réessayer plus tard.
      </p>
    )
  }

  const handleUpdate = async (formData) => {
    try {
      await updateProfile(userQuery.data.id, formData)
      toast.success('Profil mis à jour')

      if (formData instanceof FormData && formData.get('profileImage')) {
        setAvatarCandidateIndex(0)
        setAvatarVersion((value) => value + 1)
      }

      await userQuery.refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de mettre à jour le profil')
      throw error
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="card space-y-4">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary/30 bg-slate-100 shadow-inner dark:bg-slate-800">
            <img
              src={avatarSrc}
              alt={`Avatar de ${userQuery.data.firstName}`}
              onError={() => {
                if (avatarCandidateIndex < avatarCandidates.length - 1) {
                  const nextIndex = avatarCandidateIndex + 1
                  setAvatarCandidateIndex(nextIndex)
                  setAvatarSrc(avatarCandidates[nextIndex])
                } else {
                  setAvatarSrc(PLACEHOLDER_AVATAR)
                }
              }}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              {userQuery.data.firstName} {userQuery.data.lastName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Gérez les informations associées à votre compte My BiblioConnect.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {roleBadge ? (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roleBadge.className}`}
                >
                  {roleBadge.label}
                </span>
              ) : null}
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
                Modifier mes informations
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="card space-y-4">
        <h2 className="text-xl font-semibold text-primary">Informations personnelles</h2>
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Prénom
            </dt>
            <dd className="text-base text-slate-700 dark:text-slate-100">
              {userQuery.data.firstName}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Nom
            </dt>
            <dd className="text-base text-slate-700 dark:text-slate-100">
              {userQuery.data.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Login
            </dt>
            <dd className="text-base text-slate-700 dark:text-slate-100">
              @{userQuery.data.login}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Email
            </dt>
            <dd className="text-base text-slate-700 dark:text-slate-100">
              {userQuery.data.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Membre depuis
            </dt>
            <dd className="text-base text-slate-700 dark:text-slate-100">
              {formatDate(userQuery.data.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      {isEditing && (
        <EditProfileModal
          user={userQuery.data}
          onClose={() => setIsEditing(false)}
          onUpdated={handleUpdate}
        />
      )}
    </section>
  )
}

export default Profile
