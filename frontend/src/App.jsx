import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import PacientesList from './pages/pacientes/PacientesList'
import PacienteForm from './pages/pacientes/PacienteForm'
import PacienteDetalle from './pages/pacientes/PacienteDetalle'
import Agenda from './pages/agenda/Agenda'
import TratamientosList from './pages/tratamientos/TratamientosList'
import Odontograma from './pages/odontograma/Odontograma'
import OdontogramaInicio from './pages/odontograma/OdontogramaInicio'
import FacturasList from './pages/facturacion/FacturasList'
import FacturaForm from './pages/facturacion/FacturaForm'
import FacturaDetalle from './pages/facturacion/FacturaDetalle'
import Periodontograma from './pages/periodontograma/Periodontograma'
import EvolucionSoep from './pages/soep/EvolucionSoep'
import DocumentosClinicos from './pages/documentos/DocumentosClinicos'
import Inventario from './pages/inventario/Inventario'

function EnConstruccion() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <h1 className="text-2xl font-bold text-slate-800">Módulo en construcción</h1>
      <p className="mt-2 text-sm text-slate-500">
        Esta sección estará disponible próximamente.
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<PacientesList />} />
          <Route path="/pacientes/nuevo" element={<PacienteForm />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/pacientes/:id/editar" element={<PacienteForm />} />
          <Route path="/pacientes/:id/odontograma" element={<Odontograma />} />
          <Route path="/pacientes/:id/periodontograma" element={<Periodontograma />} />
          <Route path="/pacientes/:id/evolucion" element={<EvolucionSoep />} />
          <Route path="/pacientes/:id/documentos-clinicos" element={<DocumentosClinicos />} />
          <Route path="/odontograma" element={<OdontogramaInicio />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/tratamientos" element={<TratamientosList />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/facturacion" element={<FacturasList />} />
          <Route path="/facturacion/nueva" element={<FacturaForm />} />
          <Route path="/facturacion/:id" element={<FacturaDetalle />} />
          <Route path="*" element={<EnConstruccion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
