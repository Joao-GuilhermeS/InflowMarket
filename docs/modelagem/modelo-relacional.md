# Modelo Relacional

## 1. Visão geral

O banco de dados utiliza PostgreSQL por meio do Supabase e segue uma arquitetura multi-tenant.

Cada Tenant possui seus próprios usuários, clientes, produtos, fornecedores, vendas, estoque e informações financeiras.

A autenticação é realizada pelo Supabase Auth. A tabela `public.usuario` armazena os dados complementares necessários ao domínio e mantém o vínculo com `auth.users` por meio de `auth_user_id`.

## 2. Entidades

### 2.1 TENANT

Representa uma empresa/cliente do SaaS.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| nome | VARCHAR(150) | NOT NULL |
| documento | VARCHAR(30) | |
| telefone | VARCHAR(30) | |
| email | VARCHAR(150) | |
| endereco | TEXT | |
| logo | TEXT | |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data_criacao | TIMESTAMPTZ | NOT NULL |

### 2.2 USUARIO

Representa um usuário do sistema. A autenticação é gerenciada pelo Supabase Auth.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| auth_user_id | UUID | NOT NULL, UNIQUE, FK → auth.users |
| tenant_id | UUID | FK → tenant; NULL para DESENVOLVEDOR |
| nome | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | NOT NULL |
| perfil | ENUM | NOT NULL |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data_criacao | TIMESTAMPTZ | NOT NULL |

Perfis:

- DESENVOLVEDOR
- GERENTE
- VENDEDOR

Regra estrutural: `DESENVOLVEDOR` possui `tenant_id` nulo; `GERENTE` e `VENDEDOR` devem possuir `tenant_id`.

### 2.3 CLIENTE

Representa um cliente do Tenant.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| nome | VARCHAR(150) | NOT NULL |
| cpf_cnpj | VARCHAR(30) | |
| telefone | VARCHAR(30) | |
| email | VARCHAR(150) | |
| endereco | TEXT | |
| tipo | ENUM | NOT NULL, DEFAULT NORMAL |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data_criacao | TIMESTAMPTZ | NOT NULL |

Tipos:

- NORMAL
- BALCAO

O cliente `BALCAO` representa a conta utilizada para vendas avulsas e segue as regras de cliente definidas no domínio.

### 2.4 CONTA_CLIENTE

Representa a conta financeira consolidada do cliente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| cliente_id | UUID | NOT NULL, UNIQUE, FK → cliente |
| saldo_devedor | NUMERIC(15,2) | NOT NULL, DEFAULT 0 |
| data_criacao | TIMESTAMPTZ | NOT NULL |
| data_atualizacao | TIMESTAMPTZ | NOT NULL |

Cada cliente possui uma única conta. O modelo atual não possui `saldo_credito`; o controle financeiro deve ser derivado das movimentações e do saldo devedor.

### 2.5 PRODUTO

Representa uma mercadoria comercializada pelo Tenant.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| nome | VARCHAR(150) | NOT NULL |
| descricao | TEXT | |
| unidade | VARCHAR(30) | NOT NULL |
| quantidade_estoque | NUMERIC(15,3) | NOT NULL, DEFAULT 0 |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data_criacao | TIMESTAMPTZ | NOT NULL |

O estoque pode assumir valores negativos após uma venda permitida sem quantidade suficiente disponível.

### 2.6 FORNECEDOR

Representa um fornecedor de mercadorias.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| nome | VARCHAR(150) | NOT NULL |
| documento | VARCHAR(30) | |
| telefone | VARCHAR(30) | |
| email | VARCHAR(150) | |
| endereco | TEXT | |
| ativo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data_criacao | TIMESTAMPTZ | NOT NULL |

### 2.7 ENTRADA_MERCADORIA

Representa uma operação de entrada de mercadorias.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| fornecedor_id | UUID | NOT NULL, FK → fornecedor |
| usuario_id | UUID | NOT NULL, FK → usuario |
| data | TIMESTAMPTZ | NOT NULL |
| valor_total | NUMERIC(15,2) | NOT NULL, DEFAULT 0 |
| observacao | TEXT | |
| status | ENUM | NOT NULL, DEFAULT ABERTA |

Status:

- ABERTA
- FINALIZADA
- CANCELADA

### 2.8 ITEM_ENTRADA

Representa um produto dentro de uma entrada de mercadoria.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| entrada_id | UUID | NOT NULL, FK → entrada_mercadoria |
| produto_id | UUID | NOT NULL, FK → produto |
| quantidade | NUMERIC(15,3) | NOT NULL |
| custo_unitario | NUMERIC(15,2) | NOT NULL |
| valor_total | NUMERIC(15,2) | NOT NULL |

O custo da mercadoria é informado no momento da entrada.

### 2.9 VENDA

Representa uma venda consolidada.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| cliente_id | UUID | NOT NULL, FK → cliente |
| vendedor_id | UUID | NOT NULL, FK → usuario |
| numero | BIGINT | NOT NULL |
| data_venda | TIMESTAMPTZ | NOT NULL |
| tipo_venda | ENUM | NOT NULL |
| forma_pagamento | ENUM | NULL para vendas a prazo |
| prazo_dias | INTEGER | NULL para vendas à vista |
| data_vencimento | DATE | |
| valor_total | NUMERIC(15,2) | NOT NULL, DEFAULT 0 |
| valor_pago | NUMERIC(15,2) | NOT NULL, DEFAULT 0 |
| saldo | NUMERIC(15,2) | NOT NULL, DEFAULT 0 |
| status | ENUM | NOT NULL, DEFAULT EM_ABERTO |
| data_criacao | TIMESTAMPTZ | NOT NULL |
| data_atualizacao | TIMESTAMPTZ | NOT NULL |

Tipos de venda:

- AVISTA
- PRAZO

Formas de pagamento:

- DINHEIRO
- CARTAO
- PIX

Status:

- EM_ABERTO
- PAGA
- VENCIDA
- CANCELADA

A diferenciação entre `tipo_venda` e `forma_pagamento` permite representar corretamente uma venda à vista ou a prazo sem misturar as duas regras.

### 2.10 ITEM_VENDA

Representa um produto dentro de uma venda.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| venda_id | UUID | NOT NULL, FK → venda |
| produto_id | UUID | NOT NULL, FK → produto |
| quantidade | NUMERIC(15,3) | NOT NULL |
| preco_unitario | NUMERIC(15,2) | NOT NULL |
| valor_total | NUMERIC(15,2) | NOT NULL |

O preço armazenado é o preço efetivamente negociado na venda.

### 2.11 ROMANEIO

Representa o documento gerado a partir de uma venda consolidada.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| venda_id | UUID | NOT NULL, UNIQUE, FK → venda |
| numero | BIGINT | NOT NULL |
| data_geracao | TIMESTAMPTZ | NOT NULL |

Cada venda possui no máximo um romaneio. O Tenant do romaneio é obtido por meio da venda relacionada.

O documento deverá futuramente permitir exportação para PDF e impressão.

### 2.12 PAGAMENTO

Representa um pagamento registrado no sistema. O pagamento é realizado externamente; o sistema apenas registra a operação.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| cliente_id | UUID | NOT NULL, FK → cliente |
| usuario_id | UUID | NOT NULL, FK → usuario |
| valor | NUMERIC(15,2) | NOT NULL |
| forma_pagamento | ENUM | NOT NULL |
| data | TIMESTAMPTZ | NOT NULL |
| observacao | TEXT | |
| status | ENUM | NOT NULL, DEFAULT REGISTRADO |

Status:

- REGISTRADO
- CANCELADO

### 2.13 PAGAMENTO_APLICACAO

Relaciona um pagamento às vendas às quais ele foi aplicado.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| pagamento_id | UUID | NOT NULL, FK → pagamento |
| venda_id | UUID | NOT NULL, FK → venda |
| valor_aplicado | NUMERIC(15,2) | NOT NULL |

A tabela permite aplicar um pagamento a uma ou várias vendas e uma venda pode receber vários pagamentos. A aplicação deve seguir FIFO conforme as regras de negócio.

### 2.14 DEVOLUCAO

Representa uma devolução registrada no sistema. O estorno financeiro ocorre externamente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| venda_id | UUID | NOT NULL, FK → venda |
| usuario_id | UUID | NOT NULL, FK → usuario |
| valor_total | NUMERIC(15,2) | NOT NULL |
| motivo | TEXT | |
| estorno_externo | BOOLEAN | NOT NULL, DEFAULT TRUE |
| data | TIMESTAMPTZ | NOT NULL |
| status | ENUM | NOT NULL, DEFAULT REGISTRADA |

Status:

- REGISTRADA
- CANCELADA

### 2.15 ITEM_DEVOLUCAO

Representa cada produto devolvido e referencia o item original da venda.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| devolucao_id | UUID | NOT NULL, FK → devolucao |
| item_venda_id | UUID | NOT NULL, FK → item_venda |
| produto_id | UUID | NOT NULL, FK → produto |
| quantidade | NUMERIC(15,3) | NOT NULL |
| valor_unitario | NUMERIC(15,2) | NOT NULL |
| valor_total | NUMERIC(15,2) | NOT NULL |

### 2.16 COBRANCA

Representa uma cobrança realizada sobre um cliente.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| cliente_id | UUID | NOT NULL, FK → cliente |
| usuario_id | UUID | NOT NULL, FK → usuario |
| data | TIMESTAMPTZ | NOT NULL |
| forma_contato | ENUM | NOT NULL |
| status | ENUM | NOT NULL, DEFAULT REALIZADA |
| valor_cobrado | NUMERIC(15,2) | NULL |
| observacao | TEXT | |
| proxima_cobranca | DATE | |

Formas de contato:

- TELEFONE
- WHATSAPP
- PRESENCIAL
- OUTRO

Status:

- REALIZADA
- PENDENTE
- CANCELADA

### 2.17 COBRANCA_VENDA

Relaciona uma cobrança às vendas envolvidas.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| cobranca_id | UUID | NOT NULL, FK → cobranca |
| venda_id | UUID | NOT NULL, FK → venda |

Existe uma restrição de unicidade em `(cobranca_id, venda_id)`.

### 2.18 MOVIMENTACAO_ESTOQUE

Registra as movimentações de estoque.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| produto_id | UUID | NOT NULL, FK → produto |
| usuario_id | UUID | NOT NULL, FK → usuario |
| item_entrada_id | UUID | FK opcional |
| item_venda_id | UUID | FK opcional |
| item_devolucao_id | UUID | FK opcional |
| tipo | ENUM | NOT NULL |
| quantidade | NUMERIC(15,3) | NOT NULL |
| saldo_anterior | NUMERIC(15,3) | NOT NULL |
| saldo_posterior | NUMERIC(15,3) | NOT NULL |
| data | TIMESTAMPTZ | NOT NULL |

Tipos:

- ENTRADA
- VENDA
- DEVOLUCAO
- CANCELAMENTO
- AJUSTE

A origem é referenciada explicitamente por `item_entrada_id`, `item_venda_id` ou `item_devolucao_id`, de acordo com o tipo da movimentação. Ajustes não possuem uma origem de item.

### 2.19 HISTORICO

Registra operações relevantes para auditoria.

| Campo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | NOT NULL, FK → tenant |
| usuario_id | UUID | FK → usuario |
| entidade | VARCHAR(100) | NOT NULL |
| entidade_id | UUID | NOT NULL |
| tipo_operacao | VARCHAR(100) | NOT NULL |
| descricao | TEXT | NOT NULL |
| valor_anterior | JSONB | |
| valor_novo | JSONB | |
| data_hora | TIMESTAMPTZ | NOT NULL |

`entidade_id` é uma referência lógica, pois o histórico pode registrar diferentes tipos de entidades.

## 3. Relacionamentos

### Tenant

- TENANT 1:N USUARIO
- TENANT 1:N CLIENTE
- TENANT 1:N PRODUTO
- TENANT 1:N FORNECEDOR
- TENANT 1:N ENTRADA_MERCADORIA
- TENANT 1:N VENDA
- TENANT 1:N PAGAMENTO
- TENANT 1:N DEVOLUCAO
- TENANT 1:N COBRANCA
- TENANT 1:N MOVIMENTACAO_ESTOQUE
- TENANT 1:N HISTORICO

### Cliente

- CLIENTE 1:1 CONTA_CLIENTE
- CLIENTE 1:N VENDA
- CLIENTE 1:N PAGAMENTO
- CLIENTE 1:N COBRANCA

### Fornecedor e entrada

- FORNECEDOR 1:N ENTRADA_MERCADORIA
- ENTRADA_MERCADORIA 1:N ITEM_ENTRADA
- PRODUTO 1:N ITEM_ENTRADA

### Venda

- VENDA 1:N ITEM_VENDA
- PRODUTO 1:N ITEM_VENDA
- VENDA 1:1 ROMANEIO

### Pagamento

- PAGAMENTO 1:N PAGAMENTO_APLICACAO
- VENDA 1:N PAGAMENTO_APLICACAO

A relação lógica entre PAGAMENTO e VENDA é N:N, resolvida por PAGAMENTO_APLICACAO.

### Devolução

- VENDA 1:N DEVOLUCAO
- DEVOLUCAO 1:N ITEM_DEVOLUCAO
- ITEM_VENDA 1:N ITEM_DEVOLUCAO
- PRODUTO 1:N ITEM_DEVOLUCAO

### Cobrança

- COBRANCA 1:N COBRANCA_VENDA
- VENDA 1:N COBRANCA_VENDA

A relação lógica entre COBRANCA e VENDA é N:N, resolvida por COBRANCA_VENDA.

### Estoque

- PRODUTO 1:N MOVIMENTACAO_ESTOQUE
- ITEM_ENTRADA 1:N MOVIMENTACAO_ESTOQUE
- ITEM_VENDA 1:N MOVIMENTACAO_ESTOQUE
- ITEM_DEVOLUCAO 1:N MOVIMENTACAO_ESTOQUE

### Usuário

- USUARIO 1:N ENTRADA_MERCADORIA
- USUARIO 1:N VENDA
- USUARIO 1:N PAGAMENTO
- USUARIO 1:N DEVOLUCAO
- USUARIO 1:N COBRANCA
- USUARIO 1:N MOVIMENTACAO_ESTOQUE
- USUARIO 1:N HISTORICO

## 4. Regras estruturais do modelo

1. `auth.users` é a fonte de autenticação; `public.usuario` armazena os dados de domínio do usuário.
2. `auth_user_id` identifica de forma única o usuário do Supabase Auth relacionado ao registro de `public.usuario`.
3. `DESENVOLVEDOR` possui `tenant_id` nulo; `GERENTE` e `VENDEDOR` pertencem a um Tenant.
4. `CLIENTE` e `PRODUTO` pertencem a um único Tenant.
5. `CLIENTE` possui exatamente uma `CONTA_CLIENTE`.
6. `VENDA` diferencia `tipo_venda` de `forma_pagamento`.
7. `ROMANEIO` possui relação 1:1 com `VENDA`.
8. `PAGAMENTO_APLICACAO` resolve a relação N:N entre pagamentos e vendas e permite a aplicação FIFO.
9. `ITEM_DEVOLUCAO` referencia o `ITEM_VENDA` original.
10. `MOVIMENTACAO_ESTOQUE` evita referência polimórfica genérica e usa referências explícitas por tipo de origem.
11. `HISTORICO` mantém referência lógica por `entidade` e `entidade_id`.
12. O estorno financeiro de uma devolução é externo ao sistema.
