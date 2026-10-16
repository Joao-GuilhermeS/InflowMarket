import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppShell } from './layout/app-shell'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Layout() {
  const { usuario, sair } = useAuth()
  const [tenantInfo, setTenantInfo] = useState<{
    tenantId: string
    name: string
    error: boolean
  } | null>(null)

  useEffect(() => {
    let active = true

    async function loadTenantName() {
      if (!usuario?.tenant_id) return

      const { data, error } = await supabase
        .from('tenant')
        .select('nome')
        .eq('id', usuario.tenant_id)
        .single()

      if (!active) return

      if (error) {
        console.error('Erro ao carregar a loja:', error.message)
        setTenantInfo({
          tenantId: usuario.tenant_id,
          name: '',
          error: true,
        })
        return
      }

      setTenantInfo({
        tenantId: usuario.tenant_id,
        name: data.nome,
        error: false,
      })
    }

    void loadTenantName()

    return () => {
      active = false
    }
  }, [usuario?.tenant_id])

  const tenantName =
    tenantInfo && tenantInfo.tenantId === usuario?.tenant_id
      ? tenantInfo.name
      : ''
  const tenantError =
    Boolean(
      tenantInfo &&
        tenantInfo.tenantId === usuario?.tenant_id &&
        tenantInfo.error,
    )

  const initials = usuario?.nome
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <AppShell
      hasTenant={Boolean(usuario?.tenant_id)}
      initials={initials || 'IM'}
      onSignOut={() => void sair()}
      tenantError={tenantError}
      tenantName={tenantName || 'InflowMarket'}
      userName={usuario?.nome ?? 'Usuário'}
      userProfile={usuario?.perfil ?? 'USUÁRIO'}
      sidebarUserProfile={usuario?.perfil ?? 'Sem perfil'}
    >
      <Outlet />
    </AppShell>
  )
}

export default Layout