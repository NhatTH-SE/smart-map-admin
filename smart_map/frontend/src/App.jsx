import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminLayout from './layouts/AdminLayout'
import DashboardHome from './pages/DashboardHome'
import MapsPage from './pages/MapsPage'
import MapEditorPage from './pages/MapEditorPage'
import StationsPage from './pages/StationsPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#182230',
            color: '#e6edf6',
            border: '1px solid #1f2b3a',
            borderRadius: 0,
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#182230' },
            style: { borderLeft: '3px solid #10b981' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#182230' },
            style: { borderLeft: '3px solid #ef4444' },
          },
          loading: {
            iconTheme: { primary: '#3b82f6', secondary: '#182230' },
            style: { borderLeft: '3px solid #3b82f6' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="maps" element={<MapsPage />} />
          <Route path="maps/:id/edit" element={<MapEditorPage />} />
          <Route path="stations" element={<StationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
