import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente, CriarCliente } from '../../services/ClienteService'

interface ClienteFormDialogProps {
  cliente: Cliente | null
  erro: string
  salvando: boolean
  onClose: () => void
  onSubmit: (dados: Omit<CriarCliente, 'tenant_id'>) => Promise<void>
}

export function ClienteFormDialog({
  cliente,
  erro,
  salvando,
  onClose,
  onSubmit,
}: ClienteFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [documento, setDocumento] = useState(cliente?.cpf_cnpj ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [tipo, setTipo] = useState<Cliente['tipo']>(
    cliente?.tipo ?? 'NORMAL',
  )
  const [erroNome, setErroNome] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nome.trim()) {
      setErroNome('Informe o nome do cliente.')
      return
    }

    await onSubmit({
      nome: nome.trim(),
      cpf_cnpj: documento.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      endereco: endereco.trim() || undefined,
      tipo,
    })
  }

  return (
    <dialog
      className="fixed inset-0 m-0 grid h-dvh max-h-none w-full max-w-none place-items-center bg-transparent p-4 backdrop:bg-slate-950/45"
      onCancel={(event) => {
        event.preventDefault()
        if (!salvando) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !salvando) onClose()
      }}
      ref={dialogRef}
    >
      <section
        aria-labelledby="cliente-form-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cliente-form-title" className="text-lg font-semibold">
              {cliente ? 'Editar cliente' : 'Novo cliente'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {cliente
                ? 'Atualize os dados do cliente.'
                : 'Preencha os dados para cadastrar um novo cliente.'}
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
            Nome completo
            <input
              autoFocus
              className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={150}
              onChange={(event) => {
                setNome(event.currentTarget.value)
                setErroNome('')
              }}
              placeholder="Ex.: Maria Aparecida Souza"
              required
              value={nome}
            />
            {erroNome && (
              <span className="text-xs font-normal text-destructive">
                {erroNome}
              </span>
            )}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              CPF/CNPJ
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-mono text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                inputMode="numeric"
                maxLength={30}
                onChange={(event) =>
                  setDocumento(event.currentTarget.value)
                }
                placeholder="000.000.000-00"
                value={documento}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Telefone
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                inputMode="tel"
                maxLength={30}
                onChange={(event) =>
                  setTelefone(event.currentTarget.value)
                }
                placeholder="(00) 00000-0000"
                type="tel"
                value={telefone}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              E-mail
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={150}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="nome@email.com"
                type="email"
                value={email}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Tipo
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setTipo(event.currentTarget.value as Cliente['tipo'])
                }
                value={tipo}
              >
                <option value="NORMAL">Normal</option>
                <option value="BALCAO">Balcão</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Endereço
            <input
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setEndereco(event.currentTarget.value)}
              placeholder="Rua, número - Bairro"
              value={endereco}
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
                : cliente
                  ? 'Salvar alterações'
                  : 'Cadastrar cliente'}
            </button>
          </div>
        </form>
      </section>
    </dialog>
  )
}
