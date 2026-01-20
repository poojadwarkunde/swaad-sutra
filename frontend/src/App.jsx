import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import AdminPage from './pages/AdminPage'
import RatePage from './pages/RatePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/rate/:orderId" element={<RatePage />} />
    </Routes>
  )
}

export default App
