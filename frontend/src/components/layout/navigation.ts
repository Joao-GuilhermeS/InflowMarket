import {
  LayoutDashboard,
  Package,
  PackageOpen,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Visão geral', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Nova venda', to: '/pdv', icon: ShoppingCart },
  { label: 'Vendas', to: '/vendas', icon: Receipt },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Produtos', to: '/produtos', icon: Package },
]

export const operationalNavigation: NavigationItem[] = [
  { label: 'Entradas', to: '/entradas', icon: PackageOpen },
  { label: 'Fornecedores', to: '/fornecedores', icon: Truck },
]
