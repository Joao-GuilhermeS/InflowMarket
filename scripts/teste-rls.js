const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eedbrqevettzscrjnexx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5FcIU9DpeM6AGQn0iED75Q_W3uuPbET';

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testarUsuario(email, senha, nome) {
    console.log(`\nTestando: ${nome}`);

    const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
    });

    if (loginError) {
        console.error('Erro no login:', loginError.message);
        return;
    }

    const { data, error } = await supabase
        .from('usuario')
        .select(`
            id,
            nome,
            email,
            perfil,
            tenant_id,
            tenant:tenant_id (
                id,
                nome
            )
        `);

    if (error) {
        console.error('Erro ao consultar usuario:', error.message);
    } else {
        console.log('Dados retornados:');
        console.log(JSON.stringify(data, null, 2));
    }

    await supabase.auth.signOut();
}

async function main() {
    await testarUsuario(
        'gerente.a@teste.com',
        '12345678',
        'Gerente A'
    );

    await testarUsuario(
        'vendedor.a@teste.com',
        '12345678',
        'Vendedor A'
    );

    await testarUsuario(
        'gerente.b@teste.com',
        '12345678',
        'Gerente B'
    );
}

main();