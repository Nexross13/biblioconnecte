import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loader label="Chargement de la session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
