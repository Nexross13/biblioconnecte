import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const SortDropdown = ({
  value,
  options,
  onChange,
  placeholder = 'Trier',
  buttonClassName = '',
  menuClassName = '',
  ariaLabel,
  renderButtonContent,
  compact = false,
  menuAlignmentClass,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const selected = options.find((option) => option.id === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionId) => {
    onChange(optionId)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${menuClassName}`} ref={containerRef}>
      <button
        type="button"
        className={`flex items-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${compact ? '' : 'gap-2 px-4 py-2'} ${buttonClassName}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
      >
        {renderButtonContent ? (
          renderButtonContent({ selected, isOpen })
        ) : (
          <>
            <span>{selected ? selected.label : placeholder}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>
      {isOpen ? (
        <div
          className={`absolute ${menuAlignmentClass || (compact ? 'left-1/2 -translate-x-[25%]' : 'right-0')} z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800 ${
            menuAlignmentClass ? 'w-36 translate-x-2' : 'w-64'
          }`}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                value === option.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => handleSelect(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default SortDropdown
