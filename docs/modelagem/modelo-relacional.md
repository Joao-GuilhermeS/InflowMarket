# Modelo Relacional

## 1. Visão geral

O banco de dados utiliza PostgreSQL e segue uma arquitetura multi-tenant.

Cada Tenant possui seus próprios usuários, clientes, produtos, fornecedores, vendas, estoque e informações financeiras.

A autenticação dos usuários será realizada pelo Supabase Auth, enquanto os dados complementares dos usuários serão armazenados na tabela `usuario`.

---

## 2. Entidades

### 2.1 TENANT

Representa uma empresa/cliente do SaaS.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| nome | VARCHAR | NOT NULL |
| documento | VARCHAR | |
| telefone | VARCHAR | |
| email | VARCHAR | |
| endereco | TEXT | |
| logo | TEXT | |
| ativo | BOOLEAN | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |

---

### 2.2 USUARIO

Representa os usuários que operam o sistema dentro de um Tenant.

A autenticação é realizada pelo Supabase Auth.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| auth_user_id | UUID | FK → auth.users |
| tenant_id | UUID | FK → tenant |
| nome | VARCHAR | NOT NULL |
| email | VARCHAR | NOT NULL |
| perfil | VARCHAR | NOT NULL |
| ativo | BOOLEAN | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |

Perfis:

- GERENTE
- VENDEDOR

O Desenvolvedor possui acesso global ao sistema.

---

### 2.3 CLIENTE

Representa os clientes do Tenant.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| nome | VARCHAR | NOT NULL |
| cpf_cnpj | VARCHAR | |
| telefone | VARCHAR | |
| email | VARCHAR | |
| endereco | TEXT | |
| tipo | VARCHAR | NOT NULL |
| ativo | BOOLEAN | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |

Tipos:

- NORMAL
- BALCAO

---

### 2.4 CONTA_CLIENTE

Representa a conta financeira associada a um cliente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| cliente_id | UUID | FK → cliente |
| saldo_devedor | NUMERIC | NOT NULL |
| saldo_credito | NUMERIC | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |
| data_atualizacao | TIMESTAMPTZ | NOT NULL |

Cada cliente possui uma única conta.

---

### 2.5 PRODUTO

Representa uma mercadoria comercializada pelo Tenant.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| nome | VARCHAR | NOT NULL |
| descricao | TEXT | |
| unidade | VARCHAR | NOT NULL |
| quantidade_estoque | NUMERIC | NOT NULL |
| ativo | BOOLEAN | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |

O produto pode possuir estoque negativo caso uma venda seja finalizada sem quantidade suficiente disponível.

---

### 2.6 FORNECEDOR

Representa um fornecedor de mercadorias.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| nome | VARCHAR | NOT NULL |
| documento | VARCHAR | |
| telefone | VARCHAR | |
| email | VARCHAR | |
| endereco | TEXT | |
| ativo | BOOLEAN | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |

---

### 2.7 ENTRADA_MERCADORIA

Representa uma operação de entrada de mercadorias.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| fornecedor_id | UUID | FK → fornecedor |
| usuario_id | UUID | FK → usuario |
| data | TIMESTAMPTZ | NOT NULL |
| valor_total | NUMERIC | NOT NULL |
| observacao | TEXT | |
| status | VARCHAR | NOT NULL |

---

### 2.8 ITEM_ENTRADA

Representa cada produto presente em uma entrada de mercadoria.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| entrada_id | UUID | FK → entrada_mercadoria |
| produto_id | UUID | FK → produto |
| quantidade | NUMERIC | NOT NULL |
| custo_unitario | NUMERIC | NOT NULL |
| valor_total | NUMERIC | NOT NULL |

O custo da mercadoria é informado no momento da entrada.

---

### 2.9 VENDA

Representa uma venda consolidada.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| cliente_id | UUID | FK → cliente |
| vendedor_id | UUID | FK → usuario |
| numero | BIGINT | NOT NULL |
| data_venda | TIMESTAMPTZ | NOT NULL |
| tipo_pagamento | VARCHAR | NOT NULL |
| prazo_dias | INTEGER | |
| data_vencimento | DATE | |
| valor_total | NUMERIC | NOT NULL |
| valor_pago | NUMERIC | NOT NULL |
| saldo | NUMERIC | NOT NULL |
| status | VARCHAR | NOT NULL |
| data_criacao | TIMESTAMPTZ | NOT NULL |
| data_atualizacao | TIMESTAMPTZ | NOT NULL |

Status possíveis:

- EM_ABERTO
- PAGA
- VENCIDA
- CANCELADA

---

### 2.10 ITEM_VENDA

Representa cada produto presente em uma venda.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| venda_id | UUID | FK → venda |
| produto_id | UUID | FK → produto |
| quantidade | NUMERIC | NOT NULL |
| preco_unitario | NUMERIC | NOT NULL |
| valor_total | NUMERIC | NOT NULL |

O preço pode ser definido pelo vendedor durante a venda.

---

### 2.11 ROMANEIO

Representa o documento gerado a partir da venda consolidada.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| venda_id | UUID | FK → venda |
| numero | BIGINT | NOT NULL |
| data_geracao | TIMESTAMPTZ | NOT NULL |

Cada venda possui um romaneio.

O romaneio poderá ser consultado pelo histórico do cliente, exportado para PDF e impresso.

---

### 2.12 PAGAMENTO

Representa um pagamento registrado no sistema.

O pagamento é realizado externamente. O sistema apenas registra a operação.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| cliente_id | UUID | FK → cliente |
| usuario_id | UUID | FK → usuario |
| valor | NUMERIC | NOT NULL |
| forma_pagamento | VARCHAR | NOT NULL |
| data | TIMESTAMPTZ | NOT NULL |
| observacao | TEXT | |
| status | VARCHAR | NOT NULL |

---

### 2.13 PAGAMENTO_APLICACAO

Relaciona um pagamento às vendas às quais ele foi aplicado.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| pagamento_id | UUID | FK → pagamento |
| venda_id | UUID | FK → venda |
| valor_aplicado | NUMERIC | NOT NULL |

A aplicação dos pagamentos segue o padrão FIFO.

---

### 2.14 DEVOLUCAO

Representa uma devolução/estorno registrado no sistema.

O estorno financeiro ocorre externamente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| venda_id | UUID | FK → venda |
| usuario_id | UUID | FK → usuario |
| valor_total | NUMERIC | NOT NULL |
| motivo | TEXT | |
| estorno_externo | BOOLEAN | NOT NULL |
| data | TIMESTAMPTZ | NOT NULL |
| status | VARCHAR | NOT NULL |

---

### 2.15 ITEM_DEVOLUCAO

Representa cada produto devolvido.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| devolucao_id | UUID | FK → devolucao |
| item_venda_id | UUID | FK → item_venda |
| produto_id | UUID | FK → produto |
| quantidade | NUMERIC | NOT NULL |
| valor_unitario | NUMERIC | NOT NULL |
| valor_total | NUMERIC | NOT NULL |

O item da devolução referencia diretamente o item original da venda.

---

### 2.16 COBRANCA

Representa uma cobrança realizada sobre um cliente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| cliente_id | UUID | FK → cliente |
| usuario_id | UUID | FK → usuario |
| data | TIMESTAMPTZ | NOT NULL |
| forma_contato | VARCHAR | NOT NULL |
| status | VARCHAR | NOT NULL |
| valor_cobrado | NUMERIC | |
| observacao | TEXT | |
| proxima_cobranca | DATE | |

---

### 2.17 COBRANCA_VENDA

Relaciona uma cobrança às vendas envolvidas.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| cobranca_id | UUID | FK → cobranca |
| venda_id | UUID | FK → venda |

---

### 2.18 MOVIMENTACAO_ESTOQUE

Registra todas as movimentações de estoque.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| produto_id | UUID | FK → produto |
| usuario_id | UUID | FK → usuario |
| item_entrada_id | UUID | FK opcional |
| item_venda_id | UUID | FK opcional |
| item_devolucao_id | UUID | FK opcional |
| tipo | VARCHAR | NOT NULL |
| quantidade | NUMERIC | NOT NULL |
| saldo_anterior | NUMERIC | NOT NULL |
| saldo_posterior | NUMERIC | NOT NULL |
| data | TIMESTAMPTZ | NOT NULL |

Tipos:

- ENTRADA
- VENDA
- DEVOLUCAO
- CANCELAMENTO
- AJUSTE

A origem da movimentação é definida por referências explícitas, evitando uma referência polimórfica genérica.

---

### 2.19 HISTORICO

Registra operações relevantes para auditoria.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenant |
| usuario_id | UUID | FK → usuario |
| entidade | VARCHAR | NOT NULL |
| entidade_id | UUID | NOT NULL |
| tipo_operacao | VARCHAR | NOT NULL |
| descricao | TEXT | NOT NULL |
| valor_anterior | JSONB | |
| valor_novo | JSONB | |
| data_hora | TIMESTAMPTZ | NOT NULL |

`entidade_id` é uma referência lógica, pois o histórico pode registrar diferentes tipos de entidades.

---

# 3. Relacionamentos principais

## Tenant

```text
TENANT
 ├── USUARIO
 ├── CLIENTE
 ├── PRODUTO
 ├── FORNECEDOR
 ├── VENDA
 ├── PAGAMENTO
 ├── DEVOLUCAO
 ├── COBRANCA
 ├── MOVIMENTACAO_ESTOQUE
 └── HISTORICO
