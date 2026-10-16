import { useCallback, useMemo, useState } from 'react'
import type { Produto } from '../services/ProdutoService'

export interface ItemCarrinho {
  produto: Produto
  quantidade: number
  preco_unitario: number
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([])

  const adicionarProduto = useCallback((produto: Produto) => {
    setItens((atuais) => {
      const existente = atuais.find((item) => item.produto.id === produto.id)

      if (existente) {
        return atuais.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        )
      }

      return [
        ...atuais,
        {
          produto,
          quantidade: 1,
          preco_unitario: 0,
        },
      ]
    })
  }, [])

  const definirQuantidade = useCallback(
    (produtoId: string, quantidade: number) => {
      if (!Number.isFinite(quantidade) || quantidade <= 0) return

      setItens((atuais) =>
        atuais.map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade } : item,
        ),
      )
    },
    [],
  )

  const definirPreco = useCallback((produtoId: string, preco: number) => {
    if (!Number.isFinite(preco) || preco < 0) return

    setItens((atuais) =>
      atuais.map((item) =>
        item.produto.id === produtoId
          ? { ...item, preco_unitario: preco }
          : item,
      ),
    )
  }, [])

  const removerProduto = useCallback((produtoId: string) => {
    setItens((atuais) =>
      atuais.filter((item) => item.produto.id !== produtoId),
    )
  }, [])

  const limpar = useCallback(() => setItens([]), [])

  const total = useMemo(
    () =>
      Number(
        itens
          .reduce(
            (soma, item) => soma + item.quantidade * item.preco_unitario,
            0,
          )
          .toFixed(2),
      ),
    [itens],
  )

  const quantidadeTotal = useMemo(
    () => itens.reduce((soma, item) => soma + item.quantidade, 0),
    [itens],
  )

  return {
    itens,
    total,
    quantidadeTotal,
    adicionarProduto,
    definirQuantidade,
    definirPreco,
    removerProduto,
    limpar,
  }
}
