import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AlertasMedicas from '../../components/pacientes/AlertasMedicas'
import { obtenerPaciente } from '../../services/pacientesService'
import {
  crearRegistroPeriodontograma,
  obtenerPeriodontograma,
} from '../../services/periodontogramaService'
import { numeroDiente } from '../../utils/dientes'

const DIENTES = [1, 2, 3, 4].flatMap((cuadrante) => [1, 2, 3, 4, 5, 6, 7, 8].map((pieza) => cuadrante * 10 + pieza))
const PUNTOS = [
  { codigo: 'MV', nombre: 'Mesiovestibular' },
  { codigo: 'V', nombre: 'Vestibular' },
  { codigo: 'DV', nombre: 'Distovestibular' },
  { codigo: 'ML', nombre: 'Mesiolingual / palatino' },
  { codigo: 'L', nombre: 'Lingual / palatino' },
  { codigo: 'DL', nombre: 'Distolingual / palatino' },
]
const FURCAS = ['N', 'I', 'II', 'III']
const MOVILIDADES = ['0', 'I', 'II', 'III']
const claseInput = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

const vacio = () => Object.fromEntries(PUNTOS.map(({ codigo }) => [codigo, { profundidad: '', margen: '', nic: null, sangrado: false }]))

function numero(valor) {
  return valor === '' || valor === null || valor === undefined ? null : Number(valor)
}

function FormularioDiente({ pacienteId, diente, anterior, onGuardado }) {
  const [puntos, setPuntos] = useState(() => anterior?.puntos ?? vacio())
  const [furca, setFurca] = useState(() => anterior?.furca ?? 'N')
  const [movilidad, setMovilidad] = useState(() => anterior?.movilidad ?? '0')
  const [notas, setNotas] = useState(() => anterior?.notas ?? '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const actualizarPunto = (codigo, campo, valor) => {
    setPuntos((actuales) => ({
      ...actuales,
      [codigo]: { ...actuales[codigo], [campo]: valor },
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await crearRegistroPeriodontograma(pacienteId, { diente, puntos, furca, movilidad, notas })
      onGuardado()
    } catch (err) {
      setError(Object.values(err.errores ?? {})[0] ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Punto</th>
              <th className="px-3 py-2">Prof. (mm)</th>
              <th className="px-3 py-2">Margen (mm)</th>
              <th className="px-3 py-2">NIC (mm)</th>
              <th className="px-3 py-2 text-center">Sangrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PUNTOS.map(({ codigo, nombre }) => {
              const punto = puntos[codigo]
              const nic = numero(punto.profundidad) !== null && numero(punto.margen) !== null
                ? numero(punto.profundidad) + numero(punto.margen)
                : null
              return (
                <tr key={codigo}>
                  <td className="px-3 py-2"><span className="font-semibold text-slate-700">{codigo}</span><span className="ml-2 text-xs text-slate-400">{nombre}</span></td>
                  <td className="w-28 px-3 py-2"><input aria-label={`Profundidad ${codigo}`} type="number" min="0" max="20" value={punto.profundidad} onChange={(e) => actualizarPunto(codigo, 'profundidad', e.target.value)} className={claseInput} /></td>
                  <td className="w-28 px-3 py-2"><input aria-label={`Margen ${codigo}`} type="number" min="-20" max="20" value={punto.margen} onChange={(e) => actualizarPunto(codigo, 'margen', e.target.value)} className={claseInput} /></td>
                  <td className="px-3 py-2 font-bold text-teal-700">{nic ?? '—'}</td>
                  <td className="px-3 py-2 text-center"><input aria-label={`Sangrado ${codigo}`} type="checkbox" checked={punto.sangrado === true} onChange={(e) => actualizarPunto(codigo, 'sangrado', e.target.checked)} className="h-4 w-4 accent-red-500" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-500">Furca
          <select value={furca} onChange={(e) => setFurca(e.target.value)} className={`${claseInput} mt-1`}>
            {FURCAS.map((valor) => <option key={valor} value={valor}>{valor === 'N' ? 'No aplica / no evaluable' : `Grado ${valor}`}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">Movilidad
          <select value={movilidad} onChange={(e) => setMovilidad(e.target.value)} className={`${claseInput} mt-1`}>
            {MOVILIDADES.map((valor) => <option key={valor} value={valor}>{valor === '0' ? 'Grado 0' : `Grado ${valor}`}</option>)}
          </select>
        </label>
      </div>
      <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas clínicas (opcional)" className={claseInput} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={guardando} className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
        {guardando ? 'Guardando…' : 'Guardar toma periodontal'}
      </button>
    </form>
  )
}

export default function Periodontograma() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [registros, setRegistros] = useState([])
  const [diente, setDiente] = useState(11)
  const [error, setError] = useState('')

  const cargar = () => obtenerPeriodontograma(id).then(setRegistros).catch((err) => setError(err.message))

  useEffect(() => {
    Promise.all([obtenerPaciente(id), obtenerPeriodontograma(id)])
      .then(([datosPaciente, datosRegistros]) => {
        setPaciente(datosPaciente)
        setRegistros(datosRegistros)
      })
      .catch((err) => setError(err.message))
  }, [id])

  const ultimos = useMemo(() => {
    const mapa = new Map()
    registros.forEach((registro) => {
      if (!mapa.has(registro.diente)) mapa.set(registro.diente, registro)
    })
    return mapa
  }, [registros])

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!paciente) return <p className="text-sm text-slate-500">Cargando…</p>

  const actual = ultimos.get(diente)
  const sangrado = actual?.sangrado_general
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link to={`/pacientes/${paciente.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Ficha del paciente</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Periodontograma · {paciente.nombres} {paciente.apellidos}</h1>
            <p className="text-sm text-slate-500">Seis puntos por diente · NIC = profundidad + margen</p>
          </div>
          <Link to={`/pacientes/${paciente.id}/odontograma`} className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Abrir odontograma</Link>
        </div>
        <AlertasMedicas alertas={paciente.alertas} />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Dientes permanentes</h2>
            <p className="text-xs text-slate-500">Seleccione una pieza para registrar una nueva toma.</p>
          </div>
          {sangrado && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Sangrado en la última toma</span>}
        </div>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-16">
          {DIENTES.map((numeroFdi) => {
            const tieneRegistro = ultimos.has(numeroFdi)
            return <button key={numeroFdi} type="button" onClick={() => setDiente(numeroFdi)} className={`rounded-lg border px-1 py-2 text-xs font-bold transition ${diente === numeroFdi ? 'border-teal-600 bg-teal-600 text-white' : tieneRegistro ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-teal-300'}`}>{numeroDiente(numeroFdi, 'fdi')}</button>
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,760px)_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-800">Diente {numeroDiente(diente, 'fdi')}</h2><p className="text-sm text-slate-500">{actual ? `Última toma: ${actual.fecha}` : 'Sin registros previos'}</p></div>
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Pieza seleccionada</span>
          </div>
          <FormularioDiente key={`${diente}-${actual?.id ?? 'nuevo'}`} pacienteId={paciente.id} diente={diente} anterior={actual} onGuardado={cargar} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Historial de tomas</h2>
          <div className="max-h-[620px] overflow-y-auto">
            <div className="space-y-3">
              {registros.map((registro) => <button key={registro.id} type="button" onClick={() => setDiente(registro.diente)} className="w-full rounded-xl border border-slate-100 p-3 text-left hover:border-teal-200 hover:bg-teal-50"><div className="flex justify-between gap-2 text-sm font-semibold text-slate-700"><span>Diente {registro.diente}</span><span className="text-xs text-slate-400">{registro.fecha}</span></div><p className="mt-1 text-xs text-slate-500">Furca {registro.furca} · Movilidad {registro.movilidad}{registro.sangrado_general ? ' · Sangrado' : ''}</p>{registro.notas && <p className="mt-1 text-xs text-slate-500">{registro.notas}</p>}</button>)}
              {registros.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aún no hay tomas periodontales.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
