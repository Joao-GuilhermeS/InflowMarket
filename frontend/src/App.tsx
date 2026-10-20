import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

const LoginPage = lazy(() => import('./pages/Login'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Fornecedores = lazy(() => import('./pages/Fornecedores'))
const Entradas = lazy(() => import('./pages/Entradas'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const PDV = lazy(() => import('./pages/PDV'))
const Vendas = lazy(() => import('./pages/Vendas'))
const RomaneioView = lazy(() => import('./pages/RomaneioView'))

function App() {
  const { user, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="loading-screen">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Carregando sua sessão...</span>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="loading-screen">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Carregando tela...</span>
        </div>
      }
    >
      <Routes>
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="pdv" element={<PDV />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="vendas/:id/romaneio" element={<RomaneioView />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="entradas" element={<Entradas />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="fornecedores" element={<Fornecedores />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={user ? '/' : '/login'} replace />}
        />
      </Routes>
    </Suspense>
  )
}

export default App