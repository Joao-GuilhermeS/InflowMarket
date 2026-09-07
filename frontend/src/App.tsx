import { useAuth } from './context/AuthContext'
import LoginPage from './pages/Login'

import Fornecedores from './pages/Fornecedores'

function App() {
  const { user, carregando } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!user) {
    return <LoginPage />
  }

  return <Fornecedores />
}

export default App