import { Link } from 'react-router-dom'

const Unauthorized = () => (
  <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
    <h1 className="text-6xl font-bold text-primary">401</h1>
    <p className="text-sm text-slate-500 dark:text-slate-300">
      Vous n’avez pas les autorisations nécessaires pour accéder à cette page.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link to="/" className="btn">
        Retourner à l’accueil
      </Link>
      <Link to="/library" className="btn-secondary">
        Ma bibliothèque
      </Link>
    </div>
  </section>
)

export default Unauthorized
