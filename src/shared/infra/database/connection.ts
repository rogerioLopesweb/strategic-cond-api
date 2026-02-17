import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Criamos a instância internamente
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
});

// Exportamos como 'db' para ser mais intuitivo em todo o projeto
export const db = pool;
