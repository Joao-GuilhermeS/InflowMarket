import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const { usuario } = useAuth()

  return (
    <main>
      <h1>InflowMarket</h1>

      <section>
        <h2>Visão geral</h2>

        <p>
          Bem-vindo, <strong>{usuario?.nome}</strong>.
        </p>

        <p>
          Perfil: <strong>{usuario?.perfil}</strong>
        </p>

        <p>
          Tenant:{' '}
          <strong>{usuario?.tenant_id ?? 'Acesso global'}</strong>
        </p>
      </section>

      <section>
        <h2>Acesso rápido</h2>

        <nav>
          <NavLink to="/clientes">
            Clientes
          </NavLink>{' '}

          <NavLink to="/produtos">
            Produtos
          </NavLink>{' '}

          <NavLink to="/fornecedores">
            Fornecedores
          </NavLink>{' '}

          <NavLink to="/entradas">
            Entradas
          </NavLink>
        </nav>
      </section>
    </main>
  )
}

export default Dashboard
