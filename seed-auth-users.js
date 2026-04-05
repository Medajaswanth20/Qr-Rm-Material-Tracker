/**
 * Ensures demo users exist in auth_users so forgot-password can issue tokens.
 * Run once: node seed-auth-users.js
 * Default password for new rows: TempPass123!
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Shipment_db',
    password: 'Jaswanth2003M',
    port: 5432
});

const USERS = [
    { name: 'Rahul', email: 'rahul@gmail.com' },
    { name: 'Jaswanth', email: 'mvnjaswanth20@gmail.com' }
];

async function main() {
    const hash = await bcrypt.hash('TempPass123!', 10);
    for (const u of USERS) {
        const e = u.email.toLowerCase();
        const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [e]);
        if (existing.rows.length > 0) {
            console.log('Already registered:', e);
            continue;
        }
        await pool.query('INSERT INTO auth_users (name, email, password_hash) VALUES ($1, $2, $3)', [
            u.name,
            e,
            hash
        ]);
        console.log('Created user:', e, '(password: TempPass123!)');
    }
    const all = await pool.query('SELECT id, name, email FROM auth_users ORDER BY id');
    console.log('\nAll auth_users:', all.rows);
    await pool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
