import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout() {
  const { usuario, sair } = useAuth()

  return (
    <div>
      <header>
        <h1>InflowMarket</h1>

        <p>
          {usuario?.nome} — {usuario?.perfil}
        </p>

        <nav>
          <NavLink to="/entradas">
           Entradas
          </NavLink>

          <NavLink to="/clientes">
            Clientes
          </NavLink>

          <NavLink to="/produtos">
            Produtos
          </NavLink>

          <NavLink to="/fornecedores">
            Fornecedores
          </NavLink>
        </nav>

        <button onClick={sair}>
          Sair
        </button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout