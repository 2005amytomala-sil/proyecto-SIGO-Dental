import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import { anularFactura, obtenerFactura } from '../../services/facturacionService'
import { formatearMoneda } from '../../utils/moneda'
import { EstadoFactura } from './FacturasList'

function ModalAnular({ factura, onClose, onAnulada }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const confirmar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      onAnulada(await anularFactura(factura.id, motivo))
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={`Anular factura ${factura.numero}`} onClose={onClose} ancho="max-w-lg">
      <form onSubmit={confirmar} className="space-y-4">
        <p className="text-sm text-slate-600">
          La factura no se borra: queda registrada como anulada junto con el motivo.
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="Motivo de la anulación"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Volver
          </button>
          <button type="submit" disabled={guardando} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            Anular factura
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function FacturaDetalle() {
  const { id } = useParams()
  const [factura, setFactura] = useState(null)
  const [error, setError] = useState('')
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    obtenerFactura(id).then(setFactura).catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!factura) return <p className="text-sm text-slate-500">Cargando…</p>

  const anulada = factura.estado === 'Anulada'

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
        <Link to="/facturacion" className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Volver a facturación</Link>
        <div className="flex gap-2">
          {!anulada && (
            <button onClick={() => setAnulando(true)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Anular
            </button>
          )}
          <button onClick={() => window.print()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
            Imprimir comprobante
          </button>
        </div>
      </div>

      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8">
        {anulada && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-8xl font-black tracking-widest text-red-500/15 -rotate-12">
            ANULADA
          </span>
        )}

        <div className="flex flex-wrap justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xl font-bold text-teal-700">SIGO-Dental</p>
            <p className="text-sm text-slate-500">Clínica odontológica</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Comprobante de venta</p>
            <p className="font-mono text-lg font-bold text-slate-800">{factura.numero}</p>
            <p className="text-sm text-slate-500">{factura.fecha}</p>
            <div className="mt-1"><EstadoFactura estado={factura.estado} /></div>
          </div>
        </div>

        <section className="grid gap-4 border-b border-slate-200 py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">Cliente</p>
            <p className="font-semibold text-slate-800">{factura.cliente_nombre}</p>
            <p className="text-slate-600">Cédula/RUC: {factura.cliente_identificacion}</p>
            {factura.cliente_direccion && <p className="text-slate-600">{factura.cliente_direccion}</p>}
            {factura.cliente_email && <p className="text-slate-600">{factura.cliente_email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase text-slate-500">Paciente</p>
            <p className="font-semibold text-slate-800">{factura.paciente_nombre}</p>
            <p className="text-slate-600">Cédula: {factura.paciente_cedula}</p>
          </div>
        </section>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2">Descripción</th>
              <th className="pb-2 text-center">Cant.</th>
              <th className="pb-2 text-right">P. unitario</th>
              <th className="pb-2 text-right">Desc.</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {factura.detalles.map((d) => (
              <tr key={d.id}>
                <td className="py-2">{d.descripcion}{d.grava_iva && <span className="ml-1 text-xs text-slate-400">(IVA)</span>}</td>
                <td className="py-2 text-center">{d.cantidad}</td>
                <td className="py-2 text-right">{formatearMoneda(d.precio_unitario)}</td>
                <td className="py-2 text-right">{formatearMoneda(d.descuento)}</td>
                <td className="py-2 text-right font-semibold">{formatearMoneda(d.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="text-sm">
            <p className="mb-2 text-xs uppercase text-slate-500">Formas de pago</p>
            {factura.pagos.map((p) => (
              <div key={p.id} className="flex justify-between gap-3 py-0.5">
                <span className="text-slate-600">{p.metodo}{p.referencia && <span className="text-slate-400"> · {p.referencia}</span>}</span>
                <span className="font-semibold">{formatearMoneda(p.monto)}</span>
              </div>
            ))}
          </div>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal 0%</dt><dd>{formatearMoneda(factura.subtotal_0)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal {factura.iva_porcentaje}%</dt><dd>{formatearMoneda(factura.subtotal_iva)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Descuentos</dt><dd>{formatearMoneda(factura.descuento)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">IVA {factura.iva_porcentaje}%</dt><dd>{formatearMoneda(factura.iva)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800"><dt>Total</dt><dd>{formatearMoneda(factura.total)}</dd></div>
          </dl>
        </div>

        {anulada && (
          <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Anulada el {factura.anulada_en}. Motivo: {factura.motivo_anulacion}
          </p>
        )}

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Comprobante interno sin validez tributaria. La factura electrónica autorizada se integrará en una fase posterior.
        </p>
      </article>

      {anulando && (
        <ModalAnular
          factura={factura}
          onClose={() => setAnulando(false)}
          onAnulada={(f) => {
            setFactura(f)
            setAnulando(false)
          }}
        />
      )}
    </div>
  )
}
