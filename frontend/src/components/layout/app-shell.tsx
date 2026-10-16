import { useState } from 'react'
import {
  Boxes,
  ChevronDown,
  Home,
  LogOut,
  MoreHorizontal,
  ShoppingBag,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { operationalNavigation } from './navigation'

interface AppShellProps {
  children: ReactNode
  userName: string
  userProfile: string
  sidebarUserProfile: string
  initials: string
  tenantName: string
  tenantError: boolean
  hasTenant: boolean
  onSignOut: () => void
}

export function AppShell({
  children,
  userName,
  userProfile,
  sidebarUserProfile,
  initials,
  tenantName,
  tenantError,
  hasTenant,
  onSignOut,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  function closeNavigation() {
    setMobileOpen(false)
    setMoreOpen(false)
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <AppSidebar
        collapsed={collapsed}
        initials={initials}
        mobileOpen={mobileOpen}
        onNavigate={closeNavigation}
        onSignOut={onSignOut}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        userName={userName}
        userProfile={sidebarUserProfile}
      />

      <div
        className={[
          'app-content',
          collapsed ? 'app-content--expanded' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <AppHeader
          hasTenant={hasTenant}
          initials={initials}
          mobileOpen={mobileOpen}
          onSignOut={onSignOut}
          onToggleMobile={() => setMobileOpen((value) => !value)}
          tenantError={tenantError}
          tenantName={tenantName}
          userName={userName}
          userProfile={userProfile}
        />
        <main className="page-content">{children}</main>
      </div>

      <nav
        aria-label="Navegação móvel"
        className="bottom-nav"
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('a')
          ) {
            setMoreOpen(false)
          }
        }}
      >
        <BottomNavigationLink icon={ShoppingCart} label="PDV" to="/pdv" />
        <BottomNavigationLink icon={ShoppingBag} label="Vendas" to="/vendas" />
        <BottomNavigationLink icon={Users} label="Clientes" to="/clientes" />
        <BottomNavigationLink icon={Boxes} label="Produtos" to="/produtos" />
        <button
          aria-expanded={moreOpen}
          className={`bottom-nav-link ${moreOpen ? 'bottom-nav-link--active' : ''}`}
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          {moreOpen ? <ChevronDown size={19} /> : <MoreHorizontal size={19} />}
          <span>Mais</span>
        </button>
        {moreOpen && (
          <div className="bottom-nav-more">
            <BottomMoreLink
              icon={Home}
              label="Visão geral"
              onClick={() => setMoreOpen(false)}
              to="/"
            />
            {operationalNavigation.map((item) => (
              <BottomMoreLink
                key={item.to}
                icon={item.icon}
                label={item.label}
                onClick={() => setMoreOpen(false)}
                to={item.to}
              />
            ))}
            <button
              className="bottom-nav-more-link"
              onClick={() => {
                setMoreOpen(false)
                onSignOut()
              }}
              type="button"
            >
              <LogOut size={17} />
              Sair da conta
            </button>
          </div>
        )}
      </nav>
    </div>
  )
}

function BottomNavigationLink({
  icon: Icon,
  label,
  to,
}: {
  icon: LucideIcon
  label: string
  to: string
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        `bottom-nav-link${isActive ? ' bottom-nav-link--active' : ''}`
      }
      to={to}
    >
      <Icon size={19} />
      <span>{label}</span>
    </NavLink>
  )
}

function BottomMoreLink({
  icon: Icon,
  label,
  onClick,
  to,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  to: string
}) {
  return (
    <NavLink className="bottom-nav-more-link" onClick={onClick} to={to}>
      <Icon size={17} />
      {label}
    </NavLink>
  )
}
