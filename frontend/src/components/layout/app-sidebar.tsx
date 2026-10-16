import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  LogOut,
  Sprout,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  operationalNavigation,
  primaryNavigation,
} from './navigation'
import type { NavigationItem } from './navigation'

interface AppSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  initials: string
  userName: string
  userProfile: string
  onNavigate: () => void
  onSignOut: () => void
  onToggleCollapse: () => void
}

export function AppSidebar({
  collapsed,
  mobileOpen,
  initials,
  userName,
  userProfile,
  onNavigate,
  onSignOut,
  onToggleCollapse,
}: AppSidebarProps) {
  return (
    <aside
      className={[
        'sidebar',
        collapsed ? 'sidebar--collapsed' : '',
        mobileOpen ? 'sidebar--mobile-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <NavLink
        aria-label="InflowMarket - início"
        className="brand"
        onClick={onNavigate}
        to="/"
      >
        <span className="brand-mark">
          <Sprout size={21} strokeWidth={2.3} />
        </span>
        <span className="brand-copy">
          <strong>InflowMarket</strong>
          <span>Gestão de feira</span>
        </span>
      </NavLink>

      <NavigationGroup
        items={primaryNavigation}
        label="Principal"
        onNavigate={onNavigate}
      />
      <NavigationGroup
        items={operationalNavigation}
        label="Operação"
        onNavigate={onNavigate}
      />

      <div className="sidebar-bottom">
        <div className="user-card">
          <span className="user-avatar">{initials}</span>
          <span className="user-details">
            <strong>{userName}</strong>
            <span>{userProfile}</span>
          </span>
        </div>
        <button
          className="logout-button"
          onClick={onSignOut}
          title="Sair da conta"
          type="button"
        >
          <LogOut size={18} />
          <span className="nav-label">Sair da conta</span>
        </button>
        <button
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="collapse-button"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? (
            <ArrowRightFromLine size={17} />
          ) : (
            <ArrowLeftFromLine size={17} />
          )}
          <span className="collapse-label">
            {collapsed ? 'Expandir menu' : 'Recolher menu'}
          </span>
        </button>
      </div>
    </aside>
  )
}

function NavigationGroup({
  items,
  label,
  onNavigate,
}: {
  items: NavigationItem[]
  label: string
  onNavigate: () => void
}) {
  return (
    <>
      <p className="sidebar-section-label">{label}</p>
      <nav aria-label={label} className="primary-nav" onClick={onNavigate}>
        {items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
            end={item.end}
            key={item.to}
            title={item.label}
            to={item.to}
          >
            <item.icon size={19} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
