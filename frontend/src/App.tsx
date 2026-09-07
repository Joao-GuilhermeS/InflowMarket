import { useAuth } from './context/AuthContext'
import LoginPage from './pages/Login'
import Clientes from './pages/Clientes'

function App() {
  const { user, carregando, sair } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <main>
      <Clientes />

      <button onClick={sair}>
        Sair
      </button>
    </main>
  )
}

export default App