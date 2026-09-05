const { pool } = require('../src/database/pool');

async function checkDatabase() {
    try {
        console.log('Testing database connection...');
        const res = await pool.query('SELECT NOW()');
        console.log('Database connection successful! Current time from DB:', res.rows[0].now);
    } catch (err) {
        console.error('Database connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();