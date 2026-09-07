import { useAuth } from './context/AuthContext'
import LoginPage from './pages/Login'

function App() {
  const { user, usuario, carregando, sair } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <main>
      <h1>InflowMarket</h1>

      <p>Usuário autenticado: {user.email}</p>

      {usuario && (
        <>
          <p>Nome: {usuario.nome}</p>
          <p>Perfil: {usuario.perfil}</p>
          <p>Tenant: {usuario.tenant_id ?? 'Global'}</p>
        </>
      )}

      <button onClick={sair}>
        Sair
      </button>
    </main>
  )
}

export default App