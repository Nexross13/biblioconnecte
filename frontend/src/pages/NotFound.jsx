import { Link } from 'react-router-dom'

const NotFound = () => (
  <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
    <h1 className="text-6xl font-bold text-primary">404</h1>
    <p className="text-sm text-slate-500 dark:text-slate-300">
      La page que vous recherchez n&apos;existe pas ou a été déplacée.
    </p>
    <Link to="/" className="btn">
      Retourner à l&apos;accueil
    </Link>
  </section>
)

export default NotFound
