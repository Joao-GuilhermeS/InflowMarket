# Regras de Negócio

## 1. Tenants

1. Cada Tenant possui seus próprios dados e operações.
2. O Desenvolvedor possui acesso global.
3. O Gerente possui controle total do seu Tenant.
4. O Vendedor possui acesso às funcionalidades relacionadas às vendas.
5. O Desenvolvedor cria o Tenant e define o primeiro Gerente.

---

## 2. Clientes

1. Cada cliente pertence a um Tenant.
2. Cada cliente possui uma conta para controle financeiro.
3. A conta mantém o saldo devedor.
4. O sistema calcula automaticamente o saldo a partir das movimentações.
5. O Gerente pode editar o saldo devedor.
6. Toda alteração manual de saldo deve ser registrada no histórico.

---

## 3. Vendas

1. A venda pertence a um Tenant.
2. A venda possui um cliente.
3. A venda possui um vendedor responsável.
4. O vendedor pode definir o preço durante a venda.
5. A venda pode ser realizada à vista ou a prazo.
6. O prazo padrão pode ser definido pelo Tenant.
7. O vendedor pode alterar o prazo durante a venda.
8. A venda consolidada gera o romaneio.

---

## 4. Pagamentos

1. O sistema não processa pagamentos.
2. O pagamento é realizado externamente.
3. O sistema apenas registra o pagamento.
4. Pagamentos parciais são permitidos.
5. A aplicação dos pagamentos segue FIFO.
6. O pagamento é aplicado ao saldo geral das compras em aberto.
7. Quando o valor aplicado cobre integralmente uma compra, ela é classificada como paga.
8. Pagamentos e alterações relacionadas devem possuir histórico.

---

## 5. Vencimentos

1. Uma compra vencida é automaticamente classificada como `VENCIDA`.
2. O saldo devedor permanece após o vencimento.
3. A conta do cliente continua disponível para novas vendas.
4. O sistema deverá indicar que o cliente possui atraso.

---

## 6. Estoque

1. A entrada de mercadoria aumenta o estoque.
2. A venda reduz o estoque.
3. A devolução reintegra a mercadoria ao estoque.
4. O cancelamento de venda reintegra os produtos correspondentes.
5. Ajustes podem alterar o estoque.
6. Toda movimentação de estoque deve ser registrada.
7. O sistema informa ao vendedor a quantidade disponível.
8. O estoque poderá ficar negativo após uma venda finalizada.

---

## 7. Devoluções e estornos

1. O sistema não processa o pagamento do estorno.
2. O estorno é realizado externamente.
3. O usuário registra no sistema o que foi devolvido.
4. É necessário registrar produto, quantidade e valor.
5. O sistema reintegra os produtos ao estoque.
6. O sistema recalcula os valores relacionados à compra.
7. O saldo da conta é atualizado.
8. A devolução permanece registrada no histórico.

---

## 8. Controle de cobranças

1. Clientes inadimplentes devem ser identificáveis pelo sistema.
2. O sistema deve manter o saldo devedor.
3. Cada cobrança realizada deve ser registrada.
4. O histórico deve identificar a cobrança realizada e o responsável.

---

## 9. Histórico

1. Operações financeiras relevantes devem possuir registro histórico.
2. Alterações manuais realizadas pelo Gerente devem ser registradas.
3. O histórico deve identificar o usuário responsável.
4. O histórico deve registrar a operação realizada.
5. O histórico deve registrar data e hora.
