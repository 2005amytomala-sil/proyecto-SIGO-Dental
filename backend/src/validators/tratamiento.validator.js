export const CATEGORIAS_TRATAMIENTO = [
  'Diagnóstico', 'Prevención', 'Operatoria', 'Endodoncia', 'Periodoncia', 'Cirugía',
  'Ortodoncia', 'Prótesis', 'Implantología', 'Estética', 'Odontopediatría',
]

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

export function validarTratamiento(body = {}) {
  const errores = {}
  const tratamiento = {
    codigo: limpiarTexto(body.codigo)?.toUpperCase() ?? null,
    nombre: limpiarTexto(body.nombre),
    categoria: limpiarTexto(body.categoria),
    descripcion: limpiarTexto(body.descripcion),
    precio: Number(body.precio),
    duracion_min: Number(body.duracion_min),
    grava_iva: body.grava_iva === true,
  }

  if (!tratamiento.codigo) errores.codigo = 'El código es obligatorio'
  else if (tratamiento.codigo.length > 20) errores.codigo = 'Máximo 20 caracteres'
  if (!tratamiento.nombre) errores.nombre = 'El nombre es obligatorio'
  if (!CATEGORIAS_TRATAMIENTO.includes(tratamiento.categoria)) errores.categoria = 'Seleccione una categoría válida'
  if (body.precio === '' || body.precio == null || !Number.isFinite(tratamiento.precio) || tratamiento.precio < 0) {
    errores.precio = 'Ingrese un precio válido (0 o mayor)'
  } else {
    tratamiento.precio = Math.round(tratamiento.precio * 100) / 100
  }
  if (!Number.isInteger(tratamiento.duracion_min) || tratamiento.duracion_min < 15 || tratamiento.duracion_min > 480
    || tratamiento.duracion_min % 15 !== 0) {
    errores.duracion_min = 'La duración debe estar entre 15 y 480 minutos, en múltiplos de 15'
  }

  return { errores, tratamiento }
}
