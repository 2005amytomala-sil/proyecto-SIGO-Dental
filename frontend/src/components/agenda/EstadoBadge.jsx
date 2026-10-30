import { ESTADOS_CITA } from './estadosCita'

export default function EstadoBadge({ estado }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS_CITA[estado]?.clase ?? ''}`}>
      {estado}
    </span>
  )
}
