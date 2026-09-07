import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/Login'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import Fornecedores from './pages/Fornecedores'
import Layout from './components/Layout'

function App() {
  const { user, carregando } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<Navigate to="/clientes" replace />}
        />

        <Route
          path="/clientes"
          element={<Clientes />}
        />

        <Route
          path="/produtos"
          element={<Produtos />}
        />

        <Route
          path="/fornecedores"
          element={<Fornecedores />}
        />
      </Route>
    </Routes>
  )
}

export default App