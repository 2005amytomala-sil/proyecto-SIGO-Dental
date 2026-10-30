import { ABREVIATURAS, COLOR_SELLANTE, COLORES_ESTADO, esSuperior, mesialALaDerecha, numeroDiente } from '../../utils/dientes'

const AREAS = {
  arriba: '0,0 40,0 30,10 10,10',
  abajo: '10,30 30,30 40,40 0,40',
  izquierda: '0,0 10,10 10,30 0,40',
  derecha: '40,0 40,40 30,30 30,10',
}

function colorSuperficie(registros) {
  if (registros.length === 0) return '#ffffff'
  const requerido = registros.find((r) => r.estado === 'Requerido')
  if (requerido) return COLORES_ESTADO.Requerido
  if (registros.every((r) => r.hallazgo === 'sellante')) return COLOR_SELLANTE
  return COLORES_ESTADO.Existente
}

export default function Diente({ diente, registros, notacion, seleccion, onSeleccionar }) {
  const superior = esSuperior(diente)
  const mesialDerecha = mesialALaDerecha(diente)
  const caraDe = {
    arriba: superior ? 'V' : 'L',
    abajo: superior ? 'L' : 'V',
    izquierda: mesialDerecha ? 'D' : 'M',
    derecha: mesialDerecha ? 'M' : 'D',
  }

  const porSuperficie = (s) => registros.filter((r) => r.superficie === s)
  const delDiente = registros.filter((r) => !r.superficie)
  const buscar = (hallazgo) => delDiente.find((r) => r.hallazgo === hallazgo)
  const ausente = buscar('ausente')
  const exodoncia = buscar('exodoncia')
  const corona = buscar('corona')
  const endodoncia = buscar('endodoncia')
  const removible = buscar('protesis_removible')
  const seleccionado = seleccion?.diente === diente

  const area = (s) =>
    seleccionado && seleccion.superficie === s ? 'stroke-teal-500 stroke-[2.5]' : 'stroke-slate-400 hover:fill-teal-100'

  const numero = (
    <button
      type="button"
      onClick={() => onSeleccionar({ diente, superficie: null })}
      className={`w-full rounded text-xs font-semibold ${seleccionado && !seleccion.superficie ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {numeroDiente(diente, notacion)}
    </button>
  )

  const etiquetas = (
    <div className="flex h-4 flex-wrap justify-center gap-0.5">
      {delDiente.map((r) => (
        <span key={r.id} className="text-[9px] font-bold leading-4" style={{ color: r.hallazgo === 'ausente' ? '#64748b' : COLORES_ESTADO[r.estado] }}>
          {ABREVIATURAS[r.hallazgo]}
        </span>
      ))}
    </div>
  )

  return (
    <div className={`flex w-11 flex-col items-center gap-1 rounded-lg p-0.5 ${seleccionado ? 'bg-teal-50' : ''}`}>
      {superior ? numero : etiquetas}
      <svg viewBox="-5 -5 50 50" className={`h-11 w-11 ${ausente ? 'opacity-40' : ''}`}>
        {Object.entries(AREAS).map(([posicion, puntos]) => (
          <polygon
            key={posicion}
            points={puntos}
            fill={colorSuperficie(porSuperficie(caraDe[posicion]))}
            className={`cursor-pointer ${area(caraDe[posicion])}`}
            onClick={() => onSeleccionar({ diente, superficie: caraDe[posicion] })}
          >
            <title>{caraDe[posicion]}</title>
          </polygon>
        ))}
        <rect
          x="10" y="10" width="20" height="20"
          fill={colorSuperficie(porSuperficie('O'))}
          className={`cursor-pointer ${area('O')}`}
          onClick={() => onSeleccionar({ diente, superficie: 'O' })}
        />
        {corona && <circle cx="20" cy="20" r="23" fill="none" strokeWidth="2.5" stroke={COLORES_ESTADO[corona.estado]} pointerEvents="none" />}
        {endodoncia && <line x1="20" y1="-5" x2="20" y2="45" strokeWidth="3" stroke={COLORES_ESTADO[endodoncia.estado]} pointerEvents="none" />}
        {removible && <line x1="-5" y1="20" x2="45" y2="20" strokeWidth="3" strokeDasharray="5 3" stroke={COLORES_ESTADO[removible.estado]} pointerEvents="none" />}
        {(ausente || exodoncia) && (
          <g stroke={ausente ? '#475569' : COLORES_ESTADO[exodoncia.estado]} strokeWidth="3.5" pointerEvents="none">
            <line x1="-3" y1="-3" x2="43" y2="43" />
            <line x1="43" y1="-3" x2="-3" y2="43" />
          </g>
        )}
      </svg>
      {superior ? etiquetas : numero}
    </div>
  )
}
