import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { CriarProduto, Produto } from '../../services/ProdutoService'

interface ProdutoFormDialogProps {
  erro: string
  produto: Produto | null
  salvando: boolean
  onClose: () => void
  onSubmit: (dados: Omit<CriarProduto, 'tenant_id'>) => Promise<void>
}

export function ProdutoFormDialog({
  erro,
  produto,
  salvando,
  onClose,
  onSubmit,
}: ProdutoFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [descricao, setDescricao] = useState(produto?.descricao ?? '')
  const [unidade, setUnidade] = useState(produto?.unidade ?? 'UN')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      unidade: unidade.trim(),
    })
  }

  return (
    <dialog
      className="fixed inset-0 m-0 grid h-dvh max-h-none w-full max-w-none place-items-center bg-transparent p-4 backdrop:bg-slate-950/45"
      onClick={(event) => {
        if (event.target === event.currentTarget && !salvando) onClose()
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (!salvando) onClose()
      }}
      ref={dialogRef}
    >
      <section
        aria-labelledby="produto-form-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="produto-form-title" className="text-lg font-semibold">
              {produto ? 'Editar produto' : 'Novo produto'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {produto
                ? 'Atualize as informações do produto.'
                : 'Cadastre um novo item no catálogo da loja.'}
            </p>
          </div>
          <button
            aria-label="Fechar formulário"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={salvando}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nome
            <input
              autoFocus
              className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              minLength={2}
              onChange={(event) => setNome(event.currentTarget.value)}
              placeholder="Ex.: Tomate Italiano"
              required
              value={nome}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Descrição
            <textarea
              className="min-h-24 resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setDescricao(event.currentTarget.value)}
              placeholder="Detalhes opcionais sobre o produto"
              value={descricao}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Unidade de medida
            <input
              className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setUnidade(event.currentTarget.value)}
              placeholder="UN"
              required
              value={unidade}
            />
          </label>

          {erro && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {erro}
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-4 sm:flex-row">
            <button
              className="min-h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              disabled={salvando}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={salvando}
              type="submit"
            >
              {salvando
                ? 'Salvando...'
                : produto
                  ? 'Salvar alterações'
                  : 'Cadastrar produto'}
            </button>
          </div>
        </form>
      </section>
    </dialog>
  )
}
