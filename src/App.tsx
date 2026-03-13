import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Customers from './pages/Customers'
import Contracts from './pages/Contracts'
import Payments from './pages/Payments'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/araclar" element={<Vehicles />} />
          <Route path="/musteriler" element={<Customers />} />
          <Route path="/sozlesmeler" element={<Contracts />} />
          <Route path="/odemeler" element={<Payments />} />
          <Route path="/ayarlar" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
