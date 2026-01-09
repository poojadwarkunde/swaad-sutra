import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
