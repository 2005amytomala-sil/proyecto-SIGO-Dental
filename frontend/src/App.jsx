import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import PacientesList from './pages/pacientes/PacientesList'
import PacienteForm from './pages/pacientes/PacienteForm'
import PacienteDetalle from './pages/pacientes/PacienteDetalle'

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
          <Route path="*" element={<EnConstruccion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
