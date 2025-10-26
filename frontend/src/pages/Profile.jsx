import { useQuery } from '@tanstack/react-query'
import { fetchUserById } from '../api/users'
import useAuth from '../hooks/useAuth'
import formatDate from '../utils/formatDate'
import Loader from '../components/Loader.jsx'

const Profile = () => {
  const { user } = useAuth()

  const userQuery = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => fetchUserById(user.id),
    enabled: Boolean(user?.id),
  })

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

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="card space-y-3">
        <h1 className="text-3xl font-bold text-primary">Mon profil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Gérez les informations associées à votre compte BiblioConnecte.
        </p>
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
    </section>
  )
}

export default Profile
