import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Loader from './Loader.jsx'

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader label="Vérification des privilèges..." />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
