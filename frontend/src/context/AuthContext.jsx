import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  fetchCurrentUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
} from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const handleAuthSuccess = useCallback(
    ({ user: nextUser }) => {
      queryClient.clear()
      setUser(nextUser)
      toast.success(`Bienvenue ${nextUser.firstName}!`)
    },
    [queryClient],
  )

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: handleAuthSuccess,
    onError: (error) => {
      const message = error.response?.data?.message || 'Identifiants invalides'
      toast.error(message)
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: handleAuthSuccess,
    onError: (error) => {
      const message = error.response?.data?.message || "Impossible de créer l'utilisateur"
      toast.error(message)
    },
  })

  const googleLoginMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: handleAuthSuccess,
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Impossible de vérifier votre compte Google pour le moment"
      toast.error(message)
    },
  })

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.warn('Unable to logout', error)
    } finally {
      setUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentUser = await fetchCurrentUser()
        setUser(currentUser)
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.warn('Unable to fetch current user', error)
        }
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  const { mutateAsync: login, status: loginStatus } = loginMutation
  const { mutateAsync: register, status: registerStatus } = registerMutation
  const { mutateAsync: googleLogin, status: googleLoginStatus } = googleLoginMutation

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      googleLogin,
      register,
      loginStatus,
      googleLoginStatus,
      registerStatus,
      logout,
    }),
    [
      user,
      loading,
      login,
      googleLogin,
      register,
      loginStatus,
      googleLoginStatus,
      registerStatus,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
