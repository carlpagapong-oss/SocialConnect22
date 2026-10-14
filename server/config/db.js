import mysql from "mysql2/promise";
import env from "./env.js";

export const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default async function connectDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    console.log(`MySQL connected: ${env.dbHost}/${env.dbName}`);
    return pool;
  } catch (error) {
    console.warn(`MySQL unavailable: ${error.message}. Continuing without a database connection.`);
    return null;
  }
}
