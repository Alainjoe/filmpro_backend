const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.connect()
  .then(client => {
    console.log(" Connecté à PostgreSQL (Render) !");
    client.release();
  })
  .catch(err => {
    console.error(" Erreur de connexion PostgreSQL :", err);
  });

module.exports = pool;
