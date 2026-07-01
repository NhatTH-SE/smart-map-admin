import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemedToaster from './components/ThemedToaster'
import AdminLayout from './layouts/AdminLayout'
import DashboardHome from './pages/DashboardHome'
import MapsPage from './pages/MapsPage'
import MapEditorPage from './pages/MapEditorPage'
import StationsPage from './pages/StationsPage'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemedToaster />
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
    </ThemeProvider>
  )
}

export default App