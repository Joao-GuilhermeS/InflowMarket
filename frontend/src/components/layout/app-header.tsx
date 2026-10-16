import { LogOut, Menu, Store, X } from 'lucide-react'

interface AppHeaderProps {
  hasTenant: boolean
  tenantError: boolean
  tenantName: string
  userName: string
  userProfile: string
  initials: string
  mobileOpen: boolean
  onToggleMobile: () => void
  onSignOut: () => void
}

export function AppHeader({
  hasTenant,
  tenantError,
  tenantName,
  userName,
  userProfile,
  initials,
  mobileOpen,
  onToggleMobile,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          className="mobile-menu-button"
          onClick={onToggleMobile}
          type="button"
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <div aria-hidden="true" className="tenant-icon">
          <Store size={16} />
        </div>
        <div className="tenant-heading">
          <strong>{tenantName}</strong>
          <span className={tenantError ? 'tenant-status' : ''}>
            {tenantError
              ? 'Não foi possível carregar a loja'
              : hasTenant
                ? 'Loja ativa'
                : 'Acesso global'}
          </span>
        </div>
      </div>

      <div className="topbar-trailing">
        <div className="topbar-user">
          <span className="user-avatar">{initials}</span>
          <span className="topbar-user-copy">
            <strong>{userName}</strong>
            <span>Conta ativa</span>
          </span>
        </div>
        <span className="role-badge">{userProfile}</span>
        <button
          aria-label="Sair da conta"
          className="logout-top-button"
          onClick={onSignOut}
          title="Sair"
          type="button"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
