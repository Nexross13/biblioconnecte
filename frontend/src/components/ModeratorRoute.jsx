import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'

const ModeratorRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader label="Vérification des privilèges..." />
  }

  const hasModeratorRights = user?.role === 'moderator' || user?.role === 'admin'
  if (!hasModeratorRights) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ModeratorRoute
