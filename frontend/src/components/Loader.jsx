const Loader = ({ label = 'Chargement...' }) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
    <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
  </div>
)

export default Loader
