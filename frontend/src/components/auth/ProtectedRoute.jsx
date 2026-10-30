import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('sigo_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children ?? <Outlet />
}