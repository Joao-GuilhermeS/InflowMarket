import type { ReactNode } from 'react'
import type { Perfil } from './permissions'

interface RoleGuardProps {
  perfil: Perfil | null
  permitidos: Perfil[]
  children: ReactNode
}

export function RoleGuard({
  perfil,
  permitidos,
  children,
}: RoleGuardProps) {
  if (!perfil || !permitidos.includes(perfil)) {
    return <p>Acesso não autorizado.</p>
  }

  return <>{children}</>
}