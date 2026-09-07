export type Perfil = 'DESENVOLVEDOR' | 'GERENTE' | 'VENDEDOR'

export function isDesenvolvedor(perfil: Perfil | null): boolean {
  return perfil === 'DESENVOLVEDOR'
}

export function isGerente(perfil: Perfil | null): boolean {
  return perfil === 'GERENTE'
}

export function isVendedor(perfil: Perfil | null): boolean {
  return perfil === 'VENDEDOR'
}

export function podeGerenciarAdministracao(
  perfil: Perfil | null,
): boolean {
  return perfil === 'DESENVOLVEDOR' || perfil === 'GERENTE'
}

export function podeRealizarVendas(
  perfil: Perfil | null,
): boolean {
  return (
    perfil === 'DESENVOLVEDOR' ||
    perfil === 'GERENTE' ||
    perfil === 'VENDEDOR'
  )
}

export function podeExcluirVenda(
  perfil: Perfil | null,
): boolean {
  return perfil === 'DESENVOLVEDOR' || perfil === 'GERENTE'
}