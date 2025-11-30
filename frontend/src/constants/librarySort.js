export const LIBRARY_SORT_OPTIONS = [
  { id: 'recent', label: "Date d'ajout (récent → ancien)" },
  { id: 'series', label: 'Série (A → Z) puis tome' },
]

export const DEFAULT_LIBRARY_SORT = 'recent'

export const LIBRARY_SORT_COOKIE = 'library_sort_preference'

export const normalizeLibrarySort = (value) =>
  LIBRARY_SORT_OPTIONS.some((option) => option.id === value) ? value : DEFAULT_LIBRARY_SORT
