export function AlertasBadge({ alertas }) {
  if (!alertas?.length) return null
  return (
    <span
      title={alertas.join(' · ')}
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
    >
      ⚠ {alertas.length === 1 ? alertas[0] : `${alertas.length} alertas médicas`}
    </span>
  )
}

export default function AlertasMedicas({ alertas }) {
  if (!alertas?.length) return null
  return (
    <div role="alert" className="rounded-2xl border-2 border-red-500 bg-red-50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-700">
        <span className="text-xl">⚠</span> Alerta médica crítica
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {alertas.map((alerta) => (
          <li key={alerta} className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
            {alerta}
          </li>
        ))}
      </ul>
    </div>
  )
}
