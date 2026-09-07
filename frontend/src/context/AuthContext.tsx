import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Usuario {
  id: string
  auth_user_id: string
  tenant_id: string | null
  nome: string
  email: string
  perfil: 'DESENVOLVEDOR' | 'GERENTE' | 'VENDEDOR'
}

interface AuthContextData {
  session: Session | null
  user: User | null
  usuario: Usuario | null
  carregando: boolean
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextData | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function buscarUsuario(authUserId: string) {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, auth_user_id, tenant_id, nome, email, perfil')
      .eq('auth_user_id', authUserId)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error.message)
      setUsuario(null)
      return
    }

    setUsuario(data)
  }

  useEffect(() => {
    let ativo = true

    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!ativo) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await buscarUsuario(session.user.id)
      }

      setCarregando(false)
    }

    carregarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!ativo) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await buscarUsuario(session.user.id)
      } else {
        setUsuario(null)
      }

      setCarregando(false)
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  async function sair() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erro ao sair:', error.message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        usuario,
        carregando,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }

  return context
}