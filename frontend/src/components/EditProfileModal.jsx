import { useEffect, useState } from 'react'
import { isLoginValid, normalizeLogin } from '../utils/login'

const MAX_IMAGE_SIZE_MB = 5

const EditProfileModal = ({ user, onClose, onUpdated }) => {
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [login, setLogin] = useState(user.login || '')
  const [email, setEmail] = useState(user.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl(null)
      return undefined
    }

    const objectUrl = URL.createObjectURL(profileImage)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [profileImage])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setProfileImage(null)
      return
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${MAX_IMAGE_SIZE_MB} Mo`)
      event.target.value = ''
      setProfileImage(null)
      return
    }

    setError(null)
    setProfileImage(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const normalizedLogin = normalizeLogin(login)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !normalizedLogin) {
      setError('Les champs prénom, nom, login et email sont obligatoires')
      return
    }

    if (!isLoginValid(normalizedLogin)) {
      setError('Le login doit contenir 3 à 30 caractères (lettres/chiffres .-_).')
      return
    }

    if (password) {
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères')
        return
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
    }

    const formData = new FormData()
    formData.append('firstName', firstName.trim())
    formData.append('lastName', lastName.trim())
    formData.append('login', normalizedLogin)
    formData.append('email', email.trim())

    if (password) {
      formData.append('password', password)
    }

    if (profileImage) {
      formData.append('profileImage', profileImage)
    }

    try {
      setIsSubmitting(true)
      await onUpdated(formData)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour le profil')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Modifier mes informations</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <span>Prénom</span>
              <input
                className="input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <span>Nom</span>
              <input
                className="input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
            <span>Login (public)</span>
            <input
              className="input"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              required
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              3-30 caractères, lettres/chiffres et .-_ uniquement.
            </span>
          </label>
          <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <span>Nouveau mot de passe</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Laisser vide pour conserver"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <span>Confirmer le mot de passe</span>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Répétez le mot de passe"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
            <span>Photo de profil</span>
            <input
              className="input cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Formats acceptés : JPG, PNG, WEBP. Taille maximale {MAX_IMAGE_SIZE_MB} Mo.
            </span>
            {previewUrl && (
              <img src={previewUrl} alt="Aperçu" className="h-24 w-24 rounded-full object-cover" />
            )}
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Annuler
            </button>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
