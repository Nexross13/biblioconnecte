import { useState } from 'react'

const EditableProposalField = ({
  value,
  placeholder = 'Non renseigné',
  isEditable = false,
  isSaving = false,
  onSave = async () => {},
  inputType = 'text',
  multiline = false,
  displayValue,
  serializeValue,
  parseValue,
  helperText,
  displayClassName = 'block text-sm text-slate-600 dark:text-slate-200',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [localError, setLocalError] = useState(null)

  const defaultDisplay = () => {
    if (displayValue) {
      return displayValue(value, placeholder)
    }
    if (value === null || value === undefined || value === '') {
      return <span className="italic text-slate-400 dark:text-slate-500">{placeholder}</span>
    }
    return value
  }

  const activeDisplay = defaultDisplay()
  const startEditing = () => {
    setLocalError(null)
    if (serializeValue) {
      setDraft(serializeValue(value))
    } else if (value === null || value === undefined) {
      setDraft('')
    } else {
      setDraft(String(value))
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalError(null)
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    let parsedValue = draft
    setLocalError(null)
    try {
      if (parseValue) {
        parsedValue = parseValue(draft)
      }
    } catch (parseError) {
      setLocalError(parseError?.message || 'Valeur invalide')
      return
    }

    try {
      await onSave(parsedValue)
      setIsEditing(false)
    } catch (error) {
      // L'erreur est gérée par le toast dans le parent, on garde le formulaire ouvert
    }
  }

  if (!isEditable) {
    return <div className={displayClassName}>{activeDisplay}</div>
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className={`flex-1 ${displayClassName}`}>{activeDisplay}</div>
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-wide text-primary transition hover:text-primary/80"
          onClick={startEditing}
        >
          Modifier
        </button>
      </div>
    )
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      {multiline ? (
        <textarea
          className="input min-h-[120px]"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isSaving}
        />
      ) : (
        <input
          type={inputType}
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isSaving}
        />
      )}
      {helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
      {localError && <p className="text-xs text-rose-500">{localError}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn px-3 py-1.5 text-xs" disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export default EditableProposalField
