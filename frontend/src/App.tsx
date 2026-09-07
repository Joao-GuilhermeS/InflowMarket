import { useAuth } from './context/AuthContext'
import LoginPage from './pages/Login'
import { RoleGuard } from './auth/RoleGuard'

function App() {
  const { user, usuario, carregando, sair } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <LoginPage />
  }

  if (!usuario) {
    return <p>Usuário não cadastrado no sistema.</p>
  }

  return (
    <main>
      <h1>InflowMarket</h1>

      <p>Usuário: {usuario.nome}</p>
      <p>Perfil: {usuario.perfil}</p>
      <p>Tenant: {usuario.tenant_id ?? 'Global'}</p>

      <RoleGuard
        perfil={usuario.perfil}
        permitidos={['DESENVOLVEDOR', 'GERENTE']}
      >
        <section>
          <h2>Área administrativa</h2>
          <p>Somente gerente e desenvolvedor.</p>
        </section>
      </RoleGuard>

      <RoleGuard
        perfil={usuario.perfil}
        permitidos={['DESENVOLVEDOR', 'GERENTE', 'VENDEDOR']}
      >
        <section>
          <h2>Área de vendas</h2>
          <p>Área disponível para usuários operacionais.</p>
        </section>
      </RoleGuard>

      <button onClick={sair}>
        Sair
      </button>
    </main>
  )
}

export default App