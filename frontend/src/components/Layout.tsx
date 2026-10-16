import { useEffect, useState } from 'react'
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Boxes,
  ChevronDown,
  Home,
  Leaf,
  LogOut,
  Menu,
  MoreHorizontal,
  PackagePlus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import '../App.css'

interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const primaryNavigation: NavigationItem[] = [
  { label: 'Visão geral', to: '/', icon: Home, end: true },
  { label: 'Nova venda', to: '/pdv', icon: ShoppingCart },
  { label: 'Vendas', to: '/vendas', icon: ShoppingBag },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Produtos', to: '/produtos', icon: Boxes },
]

const operationsNavigation: NavigationItem[] = [
  { label: 'Entradas', to: '/entradas', icon: PackagePlus },
  { label: 'Fornecedores', to: '/fornecedores', icon: Truck },
]

function Layout() {
  const { usuario, sair } = useAuth()
  const [tenantInfo, setTenantInfo] = useState<{
    tenantId: string
    name: string
    error: boolean
  } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

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
    <div className="app-shell">
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

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
          onClick={() => setMobileOpen(false)}
          to="/"
        >
          <span className="brand-mark">
            <Leaf size={21} strokeWidth={2.3} />
          </span>
          <span className="brand-copy">
            <strong>InflowMarket</strong>
            <span>Gestão de feira</span>
          </span>
        </NavLink>

        <p className="sidebar-section-label">Principal</p>
        <nav
          aria-label="Navegação principal"
          className="primary-nav"
          onClick={() => {
            setMobileOpen(false)
            setMoreOpen(false)
          }}
        >
          {primaryNavigation.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <p className="sidebar-section-label">Operação</p>
        <nav
          aria-label="Operação"
          className="primary-nav"
          onClick={() => {
            setMobileOpen(false)
            setMoreOpen(false)
          }}
        >
          {operationsNavigation.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <span className="user-avatar">{initials || 'IM'}</span>
            <span className="user-details">
              <strong>{usuario?.nome ?? 'Usuário'}</strong>
              <span>{usuario?.perfil ?? 'Sem perfil'}</span>
            </span>
          </div>
          <button
            className="logout-button"
            onClick={() => void sair()}
            title="Sair da conta"
          >
            <LogOut size={18} />
            <span className="nav-label">Sair da conta</span>
          </button>
          <button
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
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

      <div
        className={[
          'app-content',
          collapsed ? 'app-content--expanded' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="topbar">
          <div className="topbar-leading">
            <button
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              className="mobile-menu-button"
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <div className="tenant-heading">
              <strong>{tenantName || 'InflowMarket'}</strong>
              <span className={tenantError ? 'tenant-status' : ''}>
                {tenantError
                  ? 'Não foi possível carregar a loja'
                  : usuario?.tenant_id
                    ? 'Loja ativa'
                    : 'Acesso global'}
              </span>
            </div>
          </div>

          <div className="topbar-trailing">
            <div className="topbar-user">
              <span className="user-avatar">{initials || 'IM'}</span>
              <span className="topbar-user-copy">
                <strong>{usuario?.nome ?? 'Usuário'}</strong>
                <span>Conta ativa</span>
              </span>
            </div>
            <span className="role-badge">{usuario?.perfil ?? 'USUÁRIO'}</span>
            <button
              aria-label="Sair da conta"
              className="logout-top-button"
              onClick={() => void sair()}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
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
        <BottomNavigationLink
          icon={Users}
          label="Clientes"
          to="/clientes"
        />
        <BottomNavigationLink
          icon={Boxes}
          label="Produtos"
          to="/produtos"
        />
        <button
          aria-expanded={moreOpen}
          className={`bottom-nav-link ${moreOpen ? 'bottom-nav-link--active' : ''}`}
          onClick={() => setMoreOpen((value) => !value)}
        >
          {moreOpen ? <ChevronDown size={19} /> : <MoreHorizontal size={19} />}
          <span>Mais</span>
        </button>
        {moreOpen && (
          <div className="bottom-nav-more">
            <NavLink
              className="bottom-nav-more-link"
              onClick={() => setMoreOpen(false)}
              to="/"
            >
              <Home size={17} />
              Visão geral
            </NavLink>
            <NavLink
              className="bottom-nav-more-link"
              onClick={() => setMoreOpen(false)}
              to="/entradas"
            >
              <PackagePlus size={17} />
              Entradas
            </NavLink>
            <NavLink
              className="bottom-nav-more-link"
              onClick={() => setMoreOpen(false)}
              to="/fornecedores"
            >
              <Truck size={17} />
              Fornecedores
            </NavLink>
            <button
              className="bottom-nav-more-link"
              onClick={() => {
                setMoreOpen(false)
                void sair()
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

function NavigationLink({ item }: { item: NavigationItem }) {
  const Icon = item.icon

  return (
    <NavLink
      className={({ isActive }) =>
        `nav-link${isActive ? ' nav-link--active' : ''}`
      }
      end={item.end}
      title={item.label}
      to={item.to}
    >
      <Icon size={19} />
      <span className="nav-label">{item.label}</span>
    </NavLink>
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

export default Layout