import { connect, ConnectionPool, Transaction, config } from 'mssql';
import { MssqlError } from './MssqlError';
import { Request } from './Request';

let pool: ConnectionPool;

export async function connectToMssql(connectionConfig: config) {
  pool = await connect(connectionConfig);
}

export function getPool() {
  if (pool === undefined) throw new MssqlError('No MSSQL connection');
  return pool;
}

export async function closeMssqlConnection() {
  if (pool === undefined) throw new MssqlError('No MSSQL connection');
  await pool.close();
}

export function getTransaction() {
  return new Transaction(getPool());
}

export function getRequest(transaction?: Transaction) {
  return transaction ? new Request(transaction) : new Request(getPool());
}
