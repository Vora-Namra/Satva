import mysql from 'mysql2/promise';
import logger from '../common/logger.js';
import { env } from '../config/index.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  dateStrings:true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function dbConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();

    logger.info('Database connected successfully');

    connection.release();
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function query(
  sql: string,
  params: any[] = []
) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function query2(
  sql:string,
  params:any[]=[]
){
  const [rows]=await pool.query(sql,params);
  return rows
}

export async function getConnection() {
  return pool.getConnection();
}