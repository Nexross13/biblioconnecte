import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_STORAGE_KEY = 'biblio_token'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const handleAuthSuccess = useCallback(
    ({ token: newToken, user: nextUser }) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
      setToken(newToken)
      setUser(nextUser)
      toast.success(`Bienvenue ${nextUser.firstName}!`)
    },
    [setToken, setUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

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

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const currentUser = await fetchCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.warn('Unable to fetch current user', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [token, logout])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      loginStatus: loginMutation.status,
      registerStatus: registerMutation.status,
      logout,
    }),
    [user, token, loading, loginMutation, registerMutation, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
