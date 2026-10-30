import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children, ancho = 'max-w-2xl' }) {
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className={`w-full ${ancho} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
