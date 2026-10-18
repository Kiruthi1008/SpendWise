
import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'spendwise_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT DATABASE() AS databaseName'
    );

    console.log('MySQL connected successfully:', rows[0].databaseName);
    return rows[0].databaseName;
  } finally {
    connection.release();
  }
}

export default pool;
testConnection().catch((error) => {
  console.error('MySQL connection failed:', error.message);
  process.exitCode = 1;
});