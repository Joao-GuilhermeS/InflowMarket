import { supabase } from '../lib/supabase'

const TIME_ZONE = 'America/Sao_Paulo'
const PAGE_SIZE = 1000
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
})
const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
})

interface SaleRow {
  id: string
  numero: number
  data_venda: string
  cliente_id: string
  valor_total: number | string
}

interface EntryRow {
  id: string
  data: string
  fornecedor_id: string
  valor_total: number | string
}

export interface DashboardActivity {
  id: string
  tipo: 'venda' | 'entrada'
  data: string
  titulo: string
  subtitulo: string
  valor: number
}

export interface DashboardResumo {
  vendasHoje: number
  totalVendasHoje: number
  clientesCadastrados: number
  entradasNoMes: number
  totalEntradasNoMes: number
  produtosSemEstoque: number
  vendasPorDia: { dia: string; total: number }[]
  atividadesRecentes: DashboardActivity[]
}

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00-03:00`)
  date.setUTCDate(date.getUTCDate() + days)
  return dayKey(date)
}

function dayStart(dateKey: string): string {
  return `${dateKey}T00:00:00-03:00`
}

function formatWeekday(dateKey: string): string {
  return weekdayFormatter
    .format(new Date(`${dateKey}T12:00:00-03:00`))
    .replace('.', '')
}

async function carregarVendasDoPeriodo(
  tenantId: string | null,
  inicio: string,
  fim: string,
): Promise<SaleRow[]> {
  const vendas: SaleRow[] = []

  for (let inicioPagina = 0; ; inicioPagina += PAGE_SIZE) {
    let consulta = supabase
      .from('venda')
      .select('id, numero, data_venda, cliente_id, valor_total')
      .gte('data_venda', inicio)
      .lt('data_venda', fim)
      .neq('status', 'CANCELADA')
      .order('data_venda', { ascending: true })
      .order('id', { ascending: true })
      .range(inicioPagina, inicioPagina + PAGE_SIZE - 1)

    if (tenantId) {
      consulta = consulta.eq('tenant_id', tenantId)
    }

    const { data, error } = await consulta

    if (error) {
      throw new Error(`Não foi possível carregar as vendas do período: ${error.message}`)
    }

    const pagina = data ?? []
    vendas.push(...pagina)

    if (pagina.length < PAGE_SIZE) {
      return vendas
    }
  }
}

async function carregarEntradasDoMes(
  tenantId: string | null,
  inicio: string,
  fim: string,
): Promise<EntryRow[]> {
  const entradas: EntryRow[] = []

  for (let inicioPagina = 0; ; inicioPagina += PAGE_SIZE) {
    let consulta = supabase
      .from('entrada_mercadoria')
      .select('id, data, fornecedor_id, valor_total')
      .gte('data', inicio)
      .lt('data', fim)
      .neq('status', 'CANCELADA')
      .order('data', { ascending: true })
      .order('id', { ascending: true })
      .range(inicioPagina, inicioPagina + PAGE_SIZE - 1)

    if (tenantId) {
      consulta = consulta.eq('tenant_id', tenantId)
    }

    const { data, error } = await consulta

    if (error) {
      throw new Error(`Não foi possível carregar as entradas do mês: ${error.message}`)
    }

    const pagina = data ?? []
    entradas.push(...pagina)

    if (pagina.length < PAGE_SIZE) {
      return entradas
    }
  }
}

async function carregarVendasRecentes(
  tenantId: string | null,
): Promise<SaleRow[]> {
  let consulta = supabase
    .from('venda')
    .select('id, numero, data_venda, cliente_id, valor_total')
    .neq('status', 'CANCELADA')
    .order('data_venda', { ascending: false })
    .limit(6)

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { data, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível carregar as vendas recentes: ${error.message}`)
  }

  return data ?? []
}

async function carregarEntradasRecentes(
  tenantId: string | null,
): Promise<EntryRow[]> {
  let consulta = supabase
    .from('entrada_mercadoria')
    .select('id, data, fornecedor_id, valor_total')
    .neq('status', 'CANCELADA')
    .order('data', { ascending: false })
    .limit(6)

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { data, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível carregar as entradas recentes: ${error.message}`)
  }

  return data ?? []
}

async function contarClientes(tenantId: string | null): Promise<number> {
  let consulta = supabase
    .from('cliente')
    .select('id', { count: 'exact', head: true })

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { count, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível contar os clientes: ${error.message}`)
  }

  return count ?? 0
}

async function contarProdutosSemEstoque(
  tenantId: string | null,
): Promise<number> {
  let consulta = supabase
    .from('produto')
    .select('id', { count: 'exact', head: true })
    .eq('ativo', true)
    .lte('quantidade_estoque', 0)

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { count, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível contar os produtos sem estoque: ${error.message}`)
  }

  return count ?? 0
}

async function carregarNomesClientes(
  ids: string[],
  tenantId: string | null,
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()

  let consulta = supabase
    .from('cliente')
    .select('id, nome')
    .in('id', ids)

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { data, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível carregar os clientes das vendas recentes: ${error.message}`)
  }

  return new Map((data ?? []).map((cliente) => [cliente.id, cliente.nome]))
}

async function carregarNomesFornecedores(
  ids: string[],
  tenantId: string | null,
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()

  let consulta = supabase
    .from('fornecedor')
    .select('id, nome')
    .in('id', ids)

  if (tenantId) {
    consulta = consulta.eq('tenant_id', tenantId)
  }

  const { data, error } = await consulta

  if (error) {
    throw new Error(`Não foi possível carregar os fornecedores das entradas recentes: ${error.message}`)
  }

  return new Map((data ?? []).map((fornecedor) => [fornecedor.id, fornecedor.nome]))
}

function somarValores(registros: { valor_total: number | string }[]): number {
  const centavos = registros.reduce(
    (total, registro) => total + Math.round(Number(registro.valor_total) * 100),
    0,
  )
  return centavos / 100
}

export async function carregarDashboard(
  tenantId: string | null,
): Promise<DashboardResumo> {
  const agora = new Date()
  const hoje = dayKey(agora)
  const amanha = addDays(hoje, 1)
  const inicioSemana = addDays(hoje, -6)
  const inicioMes = `${hoje.slice(0, 7)}-01`

  const [
    vendasPeriodo,
    entradasMes,
    clientesCadastrados,
    produtosSemEstoque,
    vendasRecentes,
    entradasRecentes,
  ] = await Promise.all([
    carregarVendasDoPeriodo(
      tenantId,
      dayStart(inicioSemana),
      dayStart(amanha),
    ),
    carregarEntradasDoMes(
      tenantId,
      dayStart(inicioMes),
      dayStart(amanha),
    ),
    contarClientes(tenantId),
    contarProdutosSemEstoque(tenantId),
    carregarVendasRecentes(tenantId),
    carregarEntradasRecentes(tenantId),
  ])

  const [nomesClientes, nomesFornecedores] = await Promise.all([
    carregarNomesClientes(
      [...new Set(vendasRecentes.map((venda) => venda.cliente_id))],
      tenantId,
    ),
    carregarNomesFornecedores(
      [...new Set(entradasRecentes.map((entrada) => entrada.fornecedor_id))],
      tenantId,
    ),
  ])

  const totalPorDia = new Map<string, number>()

  for (const venda of vendasPeriodo) {
    const dia = dayKey(new Date(venda.data_venda))
    totalPorDia.set(
      dia,
      (totalPorDia.get(dia) ?? 0) +
        Math.round(Number(venda.valor_total) * 100),
    )
  }

  const vendasHoje = vendasPeriodo.filter(
    (venda) => dayKey(new Date(venda.data_venda)) === hoje,
  )

  const atividades: DashboardActivity[] = [
    ...vendasRecentes.map((venda) => ({
      id: `venda-${venda.id}`,
      tipo: 'venda' as const,
      data: venda.data_venda,
      titulo: `Venda #${venda.numero}`,
      subtitulo: nomesClientes.get(venda.cliente_id) ?? 'Cliente indisponível',
      valor: Number(venda.valor_total),
    })),
    ...entradasRecentes.map((entrada) => ({
      id: `entrada-${entrada.id}`,
      tipo: 'entrada' as const,
      data: entrada.data,
      titulo: 'Entrada de mercadoria',
      subtitulo:
        nomesFornecedores.get(entrada.fornecedor_id) ??
        'Fornecedor indisponível',
      valor: Number(entrada.valor_total),
    })),
  ]
    .sort(
      (primeiro, segundo) =>
        new Date(segundo.data).getTime() - new Date(primeiro.data).getTime(),
    )
    .slice(0, 6)

  const vendasPorDia = Array.from({ length: 7 }, (_, indice) => {
    const dia = addDays(inicioSemana, indice)
    return {
      dia: formatWeekday(dia),
      total: (totalPorDia.get(dia) ?? 0) / 100,
    }
  })

  return {
    vendasHoje: vendasHoje.length,
    totalVendasHoje: somarValores(vendasHoje),
    clientesCadastrados,
    entradasNoMes: entradasMes.length,
    totalEntradasNoMes: somarValores(entradasMes),
    produtosSemEstoque,
    vendasPorDia,
    atividadesRecentes: atividades,
  }
}
