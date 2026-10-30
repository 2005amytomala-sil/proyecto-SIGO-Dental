import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BuscadorPaciente from '../../components/pacientes/BuscadorPaciente'
import { obtenerCita } from '../../services/agendaService'
import { crearFactura, obtenerConfiguracionFacturacion } from '../../services/facturacionService'
import { obtenerPaciente } from '../../services/pacientesService'
import { listarTratamientos } from '../../services/tratamientosService'
import { calcularTotales, redondear } from '../../utils/factura'
import { formatearMoneda } from '../../utils/moneda'

const claseInput =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

let siguienteClave = 1
const nuevaClave = () => siguienteClave++

const lineaDesdeTratamiento = (t) => ({
  clave: nuevaClave(),
  tratamiento_id: t.id,
  descripcion: `${t.codigo} · ${t.nombre}`,
  cantidad: 1,
  precio_unitario: t.precio,
  descuento: 0,
  grava_iva: t.grava_iva,
})

const clienteDesdePaciente = (p) => ({
  nombre: `${p.nombres} ${p.apellidos}`,
  identificacion: p.cedula ?? '',
  direccion: p.direccion ?? '',
  email: p.email ?? '',
})

function Seccion({ titulo, error, children, accion }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{titulo}</h2>
        {accion}
      </div>
      {children}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}

export default function FacturaForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const citaId = Number(params.get('cita')) || null

  const [config, setConfig] = useState({ iva_porcentaje: 0, metodos_pago: [] })
  const [tratamientos, setTratamientos] = useState([])
  const [paciente, setPaciente] = useState(null)
  const [cliente, setCliente] = useState({ nombre: '', identificacion: '', direccion: '', email: '' })
  const [detalles, setDetalles] = useState([])
  const [pagos, setPagos] = useState([{ clave: nuevaClave(), metodo: 'Efectivo', monto: '', referencia: '' }])
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    Promise.all([obtenerConfiguracionFacturacion(), listarTratamientos()])
      .then(async ([configuracion, catalogo]) => {
        setConfig(configuracion)
        setTratamientos(catalogo)
        if (!citaId) return
        const cita = await obtenerCita(citaId)
        const datosPaciente = await obtenerPaciente(cita.paciente_id)
        setPaciente({
          id: datosPaciente.id,
          nombre: `${datosPaciente.nombres} ${datosPaciente.apellidos}`,
          cedula: datosPaciente.cedula,
          alertas: datosPaciente.alertas,
        })
        setCliente(clienteDesdePaciente(datosPaciente))
        const tratamiento = catalogo.find((t) => t.nombre === cita.motivo)
        setDetalles([
          tratamiento
            ? lineaDesdeTratamiento(tratamiento)
            : { clave: nuevaClave(), tratamiento_id: null, descripcion: cita.motivo, cantidad: 1, precio_unitario: 0, descuento: 0, grava_iva: false },
        ])
      })
      .catch((err) => setMensaje(err.message))
  }, [citaId])

  const seleccionarPaciente = (p) => {
    setPaciente(p)
    if (!p) return
    obtenerPaciente(p.id)
      .then((datos) => setCliente(clienteDesdePaciente(datos)))
      .catch((err) => setMensaje(err.message))
  }

  const totales = calcularTotales(detalles, config.iva_porcentaje)
  const pagado = redondear(pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0))
  const pendiente = redondear(totales.total - pagado)

  const actualizarLinea = (clave, campo, valor) =>
    setDetalles((actual) => actual.map((d) => (d.clave === clave ? { ...d, [campo]: valor } : d)))
  const actualizarPago = (clave, campo, valor) =>
    setPagos((actual) => actual.map((p) => (p.clave === clave ? { ...p, [campo]: valor } : p)))

  const agregarTratamiento = (e) => {
    const tratamiento = tratamientos.find((t) => t.id === Number(e.target.value))
    if (tratamiento) setDetalles((actual) => [...actual, lineaDesdeTratamiento(tratamiento)])
    e.target.value = ''
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setMensaje('')
    try {
      const factura = await crearFactura({
        paciente_id: paciente?.id,
        cita_id: citaId,
        cliente_nombre: cliente.nombre,
        cliente_identificacion: cliente.identificacion,
        cliente_direccion: cliente.direccion,
        cliente_email: cliente.email,
        detalles,
        pagos,
      })
      navigate(`/facturacion/${factura.id}`)
    } catch (err) {
      setMensaje(err.message)
      setErrores(err.errores ?? {})
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva factura</h1>
          <p className="text-sm text-slate-500">
            {citaId ? 'Cobro de una cita atendida' : 'Registre los servicios y las formas de pago'}
          </p>
        </div>
        <Link to="/facturacion" className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Volver</Link>
      </div>

      {mensaje && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{mensaje}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Paciente" error={errores.paciente_id}>
          <BuscadorPaciente paciente={paciente} onSeleccionar={seleccionarPaciente} />
        </Seccion>

        <Seccion titulo="Datos de facturación">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['nombre', 'Nombre / razón social'],
              ['identificacion', 'Cédula / RUC'],
              ['direccion', 'Dirección'],
              ['email', 'Correo electrónico'],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="text-xs font-semibold text-slate-500">
                {etiqueta}
                <input
                  value={cliente[campo]}
                  onChange={(e) => setCliente({ ...cliente, [campo]: e.target.value })}
                  className={`${claseInput} mt-1`}
                />
                {errores[`cliente_${campo}`] && <span className="text-red-600">{errores[`cliente_${campo}`]}</span>}
              </label>
            ))}
          </div>
        </Seccion>
      </div>

      <Seccion
        titulo="Tratamientos y servicios"
        error={errores.detalles}
        accion={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <select onChange={agregarTratamiento} defaultValue="" className={`${claseInput} sm:w-80`}>
              <option value="" disabled>+ Agregar del catálogo…</option>
              {tratamientos.map((t) => (
                <option key={t.id} value={t.id}>{t.codigo} · {t.nombre} ({formatearMoneda(t.precio)})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDetalles([...detalles, { clave: nuevaClave(), tratamiento_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0, grava_iva: false }])}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              + Línea libre
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Descripción</th>
                <th className="w-20 pb-2">Cant.</th>
                <th className="w-28 pb-2">P. unitario</th>
                <th className="w-28 pb-2">Descuento</th>
                <th className="w-16 pb-2 text-center">IVA</th>
                <th className="w-28 pb-2 text-right">Subtotal</th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalles.map((d) => (
                <tr key={d.clave}>
                  <td className="py-2 pr-2">
                    <input value={d.descripcion} onChange={(e) => actualizarLinea(d.clave, 'descripcion', e.target.value)} className={claseInput} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min="1" value={d.cantidad} onChange={(e) => actualizarLinea(d.clave, 'cantidad', e.target.value)} className={claseInput} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min="0" step="0.01" value={d.precio_unitario} onChange={(e) => actualizarLinea(d.clave, 'precio_unitario', e.target.value)} className={claseInput} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min="0" step="0.01" value={d.descuento} onChange={(e) => actualizarLinea(d.clave, 'descuento', e.target.value)} className={claseInput} />
                  </td>
                  <td className="py-2 text-center">
                    <input type="checkbox" checked={d.grava_iva} onChange={(e) => actualizarLinea(d.clave, 'grava_iva', e.target.checked)} className="h-4 w-4 accent-teal-600" />
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-800">
                    {formatearMoneda((Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) - (Number(d.descuento) || 0))}
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => setDetalles(detalles.filter((x) => x.clave !== d.clave))} className="px-2 text-lg text-slate-400 hover:text-red-600" title="Quitar">×</button>
                  </td>
                </tr>
              ))}
              {detalles.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Agregue tratamientos del catálogo o una línea libre</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal 0%</dt><dd>{formatearMoneda(totales.subtotal_0)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal {config.iva_porcentaje}%</dt><dd>{formatearMoneda(totales.subtotal_iva)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Descuentos</dt><dd>{formatearMoneda(totales.descuento)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">IVA {config.iva_porcentaje}%</dt><dd>{formatearMoneda(totales.iva)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800"><dt>Total</dt><dd>{formatearMoneda(totales.total)}</dd></div>
        </dl>
      </Seccion>

      <Seccion
        titulo="Formas de pago"
        error={errores.pagos}
        accion={
          <button
            type="button"
            onClick={() => setPagos([...pagos, { clave: nuevaClave(), metodo: 'Tarjeta de débito', monto: pendiente > 0 ? pendiente : '', referencia: '' }])}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            + Agregar forma de pago
          </button>
        }
      >
        <div className="space-y-3">
          {pagos.map((p) => (
            <div key={p.clave} className="grid gap-2 sm:grid-cols-[1fr_9rem_1fr_auto_auto]">
              <select value={p.metodo} onChange={(e) => actualizarPago(p.clave, 'metodo', e.target.value)} className={claseInput}>
                {config.metodos_pago.map((m) => <option key={m}>{m}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Monto" value={p.monto} onChange={(e) => actualizarPago(p.clave, 'monto', e.target.value)} className={claseInput} />
              <input
                placeholder={p.metodo === 'Efectivo' ? 'Referencia (opcional)' : 'N° de voucher, transferencia o póliza'}
                value={p.referencia}
                onChange={(e) => actualizarPago(p.clave, 'referencia', e.target.value)}
                className={claseInput}
              />
              <button
                type="button"
                disabled={pendiente <= 0}
                onClick={() => actualizarPago(p.clave, 'monto', redondear((Number(p.monto) || 0) + pendiente))}
                className="rounded-xl border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40"
              >
                Asignar saldo
              </button>
              <button
                type="button"
                disabled={pagos.length === 1}
                onClick={() => setPagos(pagos.filter((x) => x.clave !== p.clave))}
                className="px-2 text-lg text-slate-400 hover:text-red-600 disabled:opacity-30"
                title="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-6 text-sm">
          <span className="text-slate-500">Pagado: <strong className="text-slate-800">{formatearMoneda(pagado)}</strong></span>
          {pendiente === 0 ? (
            <span className="font-semibold text-emerald-700">Pagos completos</span>
          ) : pendiente > 0 ? (
            <span className="font-semibold text-amber-700">Pendiente: {formatearMoneda(pendiente)}</span>
          ) : (
            <span className="font-semibold text-red-700">Excede el total en {formatearMoneda(-pendiente)}</span>
          )}
        </div>
      </Seccion>

      <div className="flex justify-end gap-3">
        <Link to="/facturacion" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</Link>
        <button type="submit" disabled={guardando} className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {guardando ? 'Emitiendo…' : 'Emitir factura'}
        </button>
      </div>
    </form>
  )
}
