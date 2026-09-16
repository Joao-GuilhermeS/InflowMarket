select
    id,
    nome,
    tenant_id,
    tipo
from public.cliente
order by data_criacao desc;