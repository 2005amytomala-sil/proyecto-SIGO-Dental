import { useNavigate } from 'react-router-dom'
import BuscadorPaciente from '../../components/pacientes/BuscadorPaciente'

export default function OdontogramaInicio() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Odontograma</h1>
        <p className="text-sm text-slate-500">Busque al paciente para abrir su odontograma</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <BuscadorPaciente paciente={null} onSeleccionar={(p) => p && navigate(`/pacientes/${p.id}/odontograma`)} />
      </div>
    </div>
  )
}
