import { supabase } from '../lib/supabase'
import type { ItemCarrinho } from '../hooks/useCarrinho'

export interface Vendedor {
  id: string
  nome: string
}

export interface VendaResumo {
  id: string
  numero: number
  dataVenda: string
  clienteId: string
  cliente: string
  vendedor: string
  valorTotal: number
  saldo: number
  status: 'EM_ABERTO' | 'PAGA' | 'VENCIDA' | 'CANCELADA'
  tipoVenda: 'AVISTA' | 'PRAZO'
}

export interface FinalizarVendaInput {
  tenantId: string
  clienteId: string
  vendedorId: string
  tipoVenda: 'AVISTA' | 'PRAZO'
  formaPagamento: 'DINHEIRO' | 'CARTAO' | 'PIX' | null
  prazoDias: number | null
  itens: ItemCarrinho[]
}

export interface ItemRomaneio {
  produto: string
  unidade: string
  quantidade: number
  precoUnitario: number
  valorTotal: number
}

export interface RomaneioVenda {
  id: string
  tenantId: string
  tenantNome: string
  tenantLogo: string | null
  numeroVenda: number
  numeroRomaneio: number
  dataVenda: string
  cliente: string
  vendedor: string
  tipoVenda: 'AVISTA' | 'PRAZO'
  formaPagamento: 'DINHEIRO' | 'CARTAO' | 'PIX' | null
  prazoDias: number | null
  dataVencimento: string | null
  valorTotal: number
  itens: ItemRomaneio[]
}

export async function listarVendedores(
  tenantId: string,
): Promise<Vendedor[]> {
  const { data, error } = await supabase
    .from('usuario')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('nome')

  if (error) {
    throw new Error(`Não foi possível carregar os vendedores: ${error.message}`)
  }

  return data ?? []
}

export async function listarVendas(
  tenantId: string,
): Promise<VendaResumo[]> {
  const { data: vendas, error } = await supabase
    .from('venda')
    .select(
      'id, numero, data_venda, cliente_id, vendedor_id, valor_total, saldo, status, tipo_venda',
    )
    .eq('tenant_id', tenantId)
    .order('data_venda', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Não foi possível carregar as vendas: ${error.message}`)
  }

  if (vendas.length === 0) return []

  const [clientesResult, vendedoresResult] = await Promise.all([
    supabase
      .from('cliente')
      .select('id, nome')
      .eq('tenant_id', tenantId),
    supabase
      .from('usuario')
      .select('id, nome')
      .eq('tenant_id', tenantId),
  ])

  if (clientesResult.error) {
    throw new Error(
      `Não foi possível carregar os clientes das vendas: ${clientesResult.error.message}`,
    )
  }

  if (vendedoresResult.error) {
    throw new Error(
      `Não foi possível carregar os vendedores das vendas: ${vendedoresResult.error.message}`,
    )
  }

  const clientesPorId = new Map(
    clientesResult.data.map((cliente) => [cliente.id, cliente.nome]),
  )
  const vendedoresPorId = new Map(
    vendedoresResult.data.map((vendedor) => [vendedor.id, vendedor.nome]),
  )

  return vendas.map((venda) => ({
    id: venda.id,
    numero: venda.numero,
    dataVenda: venda.data_venda,
    clienteId: venda.cliente_id,
    cliente: clientesPorId.get(venda.cliente_id) ?? 'Cliente removido',
    vendedor: vendedoresPorId.get(venda.vendedor_id) ?? 'Vendedor removido',
    valorTotal: Number(venda.valor_total),
    saldo: Number(venda.saldo),
    status: venda.status,
    tipoVenda: venda.tipo_venda,
  }))
}

export async function finalizarVenda(
  input: FinalizarVendaInput,
): Promise<string> {
  // The schema requires a positive number; finalization replaces this draft placeholder.
  const { data: venda, error: erroVenda } = await supabase
    .from('venda')
    .insert({
      tenant_id: input.tenantId,
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
      numero: 1,
      tipo_venda: input.tipoVenda,
      forma_pagamento: input.formaPagamento,
      prazo_dias: input.prazoDias,
    })
    .select('id')
    .single()

  if (erroVenda) {
    throw new Error(`Não foi possível iniciar a venda: ${erroVenda.message}`)
  }

  const vendaId = venda.id
  const itens = input.itens.map((item) => ({
    venda_id: vendaId,
    produto_id: item.produto.id,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    valor_total: Number(
      (item.quantidade * item.preco_unitario).toFixed(2),
    ),
  }))

  const { error: erroItens } = await supabase
    .from('item_venda')
    .insert(itens)

  if (erroItens) {
    throw new Error(
      `A venda ${vendaId} foi iniciada, mas seus itens não foram salvos: ${erroItens.message}`,
    )
  }

  const { data: vendaFinalizada, error: erroFinalizacao } =
    await supabase.rpc('finalizar_venda', {
      p_venda_id: vendaId,
    })

  if (erroFinalizacao) {
    throw new Error(
      `Os itens foram salvos, mas a venda não foi finalizada. Venda ${vendaId}: ${erroFinalizacao.message}`,
    )
  }

  return vendaFinalizada
}

export async function buscarRomaneio(
  vendaId: string,
): Promise<RomaneioVenda> {
  const { data: venda, error: erroVenda } = await supabase
    .from('venda')
    .select(
      'id, tenant_id, numero, data_venda, cliente_id, vendedor_id, tipo_venda, forma_pagamento, prazo_dias, data_vencimento, valor_total',
    )
    .eq('id', vendaId)
    .single()

  if (erroVenda) {
    throw new Error(`Não foi possível carregar a venda: ${erroVenda.message}`)
  }

  const [
    tenantResult,
    clienteResult,
    vendedorResult,
    itensResult,
    romaneioResult,
  ] =
    await Promise.all([
      supabase
        .from('tenant')
        .select('nome, logo')
        .eq('id', venda.tenant_id)
        .single(),
      supabase
        .from('cliente')
        .select('nome')
        .eq('id', venda.cliente_id)
        .single(),
      supabase
        .from('usuario')
        .select('nome')
        .eq('id', venda.vendedor_id)
        .single(),
      supabase
        .from('item_venda')
        .select('id, produto_id, quantidade, preco_unitario, valor_total')
        .eq('venda_id', vendaId)
        .order('id'),
      supabase
        .from('romaneio')
        .select('numero')
        .eq('venda_id', vendaId)
        .single(),
    ])

  if (clienteResult.error) {
    throw new Error(
      `Não foi possível carregar o cliente: ${clienteResult.error.message}`,
    )
  }

  if (tenantResult.error) {
    throw new Error(
      `Não foi possível carregar a loja: ${tenantResult.error.message}`,
    )
  }

  if (vendedorResult.error) {
    throw new Error(
      `Não foi possível carregar o vendedor: ${vendedorResult.error.message}`,
    )
  }

  if (itensResult.error) {
    throw new Error(
      `Não foi possível carregar os itens: ${itensResult.error.message}`,
    )
  }

  if (romaneioResult.error) {
    throw new Error(
      `Não foi possível carregar o romaneio: ${romaneioResult.error.message}`,
    )
  }

  const produtoIds = [...new Set(itensResult.data.map((item) => item.produto_id))]
  const { data: produtos, error: erroProdutos } = await supabase
    .from('produto')
    .select('id, nome, unidade')
    .in('id', produtoIds)

  if (erroProdutos) {
    throw new Error(
      `Não foi possível carregar os produtos do romaneio: ${erroProdutos.message}`,
    )
  }

  const produtoPorId = new Map(
    produtos.map((produto) => [produto.id, produto]),
  )

  return {
    id: venda.id,
    tenantId: venda.tenant_id,
    tenantNome: tenantResult.data.nome,
    tenantLogo: tenantResult.data.logo,
    numeroVenda: venda.numero,
    numeroRomaneio: romaneioResult.data.numero,
    dataVenda: venda.data_venda,
    cliente: clienteResult.data.nome,
    vendedor: vendedorResult.data.nome,
    tipoVenda: venda.tipo_venda,
    formaPagamento: venda.forma_pagamento,
    prazoDias: venda.prazo_dias,
    dataVencimento: venda.data_vencimento,
    valorTotal: Number(venda.valor_total),
    itens: itensResult.data.map((item) => {
      const produto = produtoPorId.get(item.produto_id)

      if (!produto) {
        throw new Error(
          `Produto ${item.produto_id} não encontrado para o item do romaneio.`,
        )
      }

      return {
        produto: produto.nome,
        unidade: produto.unidade,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.preco_unitario),
        valorTotal: Number(item.valor_total),
      }
    }),
  }
}
