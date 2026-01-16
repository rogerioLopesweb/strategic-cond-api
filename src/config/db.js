const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Dica: A Hostinger às vezes exige SSL para conexões externas.
  // Se der erro de conexão, descomente a linha abaixo:
  // ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Conexão estabelecida com o PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};