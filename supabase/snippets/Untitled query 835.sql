begin;

select set_config(
    'request.jwt.claim.sub',
    'f10f701e-4302-4936-9c74-a5461daf887b',
    true
);

select public.finalizar_entrada_mercadoria(
    '44444444-4444-4444-4444-444444444444'::uuid
);

commit;