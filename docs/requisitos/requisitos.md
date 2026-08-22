# Requisitos do Sistema

## 1. Visão geral

O sistema será um SaaS destinado ao gerenciamento de vendas e operações comerciais de feirantes.

A aplicação deverá permitir que diferentes Tenants utilizem o sistema de forma isolada, mantendo seus próprios clientes, produtos, fornecedores, vendas, estoque, contas e histórico.

---

## 2. Multi-tenancy

O sistema deverá permitir a existência de múltiplos Tenants.

Cada Tenant deverá possuir seus próprios:

- Usuários;
- Clientes;
- Produtos;
- Fornecedores;
- Vendas;
- Estoque;
- Contas;
- Pagamentos;
- Cobranças;
- Histórico.

Os dados de um Tenant não deverão ser acessíveis por usuários de outro Tenant.

---

## 3. Usuários e hierarquia

O sistema deverá possuir três níveis administrativos:

### Desenvolvedor

Possui acesso global ao sistema e a todos os Tenants.

É responsável pela criação dos Tenants e definição do primeiro gerente.

### Gerente

Possui controle total sobre seu respectivo Tenant.

Pode administrar usuários, operações financeiras e demais funcionalidades administrativas permitidas pelo sistema.

### Vendedor

Pode executar as funcionalidades relacionadas às vendas.

Alterações administrativas e operações restritas permanecem sob responsabilidade do gerente.

---

## 4. Clientes

O sistema deverá permitir:

- Cadastro de clientes;
- Consulta de clientes;
- Manutenção dos dados;
- Histórico de compras;
- Consulta de saldo;
- Consulta de débitos;
- Registro e acompanhamento de cobranças.

Deverá existir uma conta associada ao cliente para controle financeiro.

---

## 5. Produtos

O sistema deverá permitir:

- Cadastro de produtos;
- Consulta de produtos;
- Registro de estoque;
- Pesquisa durante a venda;
- Controle das movimentações de estoque.

Não haverá necessidade de inativação de produtos para impedir sua seleção durante a venda, uma vez que o sistema utilizará pesquisa de produtos.

---

## 6. Fornecedores

O sistema deverá permitir o cadastro e gerenciamento de fornecedores.

---

## 7. Entrada de mercadorias

O sistema deverá registrar a entrada de mercadorias.

Cada entrada deverá permitir registrar:

- Fornecedor;
- Produtos;
- Quantidades;
- Custo informado;
- Data;
- Usuário responsável.

A entrada deverá atualizar o estoque.

---

## 8. Vendas

O sistema deverá permitir:

- Criar vendas;
- Pesquisar produtos;
- Adicionar produtos;
- Definir quantidade;
- Definir preço da venda;
- Consolidar os itens;
- Registrar o vendedor;
- Registrar o cliente;
- Definir pagamento;
- Definir prazo;
- Atualizar estoque;
- Registrar a venda no histórico.

O preço de venda poderá ser definido pelo vendedor durante a operação.

---

## 9. Estoque

O sistema deverá manter o controle das movimentações de estoque.

As principais movimentações serão:

- Entrada;
- Venda;
- Devolução;
- Cancelamento;
- Ajuste.

Durante a venda, o sistema deverá informar ao vendedor a quantidade disponível em estoque.

Caso a venda seja finalizada mesmo sem estoque suficiente, o estoque poderá assumir quantidade negativa.

---

## 10. Contas a receber

O sistema deverá controlar os valores devidos pelos clientes.

Deverá permitir:

- Visualização do saldo;
- Registro de pagamentos;
- Pagamentos parciais;
- Controle de vencimentos;
- Aplicação dos pagamentos;
- Histórico financeiro.

Os pagamentos serão realizados externamente.

O sistema somente registrará e organizará essas movimentações.

---

## 11. Regra FIFO

A aplicação dos pagamentos às compras em aberto deverá seguir o padrão FIFO.

O pagamento será aplicado primeiro às compras mais antigas em aberto.

Quando o valor aplicado cobrir integralmente uma compra, ela será classificada como paga.

---

## 12. Inadimplência

Compras cujo vencimento seja ultrapassado deverão ser classificadas automaticamente como `VENCIDA`.

O saldo devedor deverá permanecer.

O cliente continuará podendo realizar novas vendas.

O sistema deverá apenas indicar que o cliente possui atraso.

---

## 13. Cobranças

O sistema deverá possuir módulo de cobrança.

Deverá permitir:

- Visualizar clientes inadimplentes;
- Consultar valores vencidos;
- Registrar cobranças;
- Registrar observações;
- Registrar responsável pela cobrança;
- Consultar histórico de cobranças.

---

## 14. Devoluções e estornos

O sistema não realizará pagamentos ou devoluções financeiras.

O processo financeiro será realizado externamente.

O sistema deverá registrar o estorno realizado externamente e permitir informar:

- Venda relacionada;
- Produto devolvido;
- Quantidade;
- Valor;
- Motivo;
- Responsável.

A devolução deverá:

- Reintegrar os produtos ao estoque;
- Atualizar os valores da compra;
- Atualizar o saldo da conta;
- Registrar a operação no histórico.

---

## 15. Romaneio

O romaneio será gerado a partir da venda consolidada.

Deverá ser acessível pelo histórico do cliente.

Deverá conter informações da venda, incluindo:

- Cliente;
- Vendedor;
- Produtos;
- Quantidades;
- Valores;
- Forma de pagamento;
- Data;
- Identificação do Tenant.

Deverá existir funcionalidade para:

- Exportar para PDF;
- Imprimir.

---

## 16. Histórico e auditoria

Operações relevantes deverão ser registradas no histórico.

Entre elas:

- Vendas;
- Pagamentos;
- Estornos;
- Devoluções;
- Alterações financeiras;
- Alterações de saldo;
- Cobranças;
- Ajustes de estoque;
- Cancelamentos.

Alterações realizadas pelo gerente sobre valores financeiros deverão ser registradas.

---

## 17. Relatórios

O sistema deverá possuir relatórios relacionados às operações comerciais e financeiras.

O dashboard de lucros brutos e líquidos foi considerado para evolução futura e não fará parte da primeira versão.
