import type { Produto } from '../../services/ProdutoService'

const quantidade = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

export function StockIndicator({
  produto,
}: {
  produto: Pick<Produto, 'quantidade_estoque' | 'unidade'>
}) {
  const semEstoque = produto.quantidade_estoque <= 0

  return (
    <div className="flex min-w-28 flex-col gap-1">
      <span className="font-medium tabular-nums">
        {quantidade.format(produto.quantidade_estoque)}{' '}
        <span className="text-xs font-normal text-muted-foreground">
          {produto.unidade}
        </span>
      </span>
      <span
        className={`text-xs ${
          semEstoque ? 'text-destructive' : 'text-success-foreground'
        }`}
      >
        {semEstoque ? 'Sem estoque' : 'Disponível'}
      </span>
    </div>
  )
}
