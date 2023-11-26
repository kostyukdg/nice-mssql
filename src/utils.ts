import { connect, ConnectionPool, Transaction, config } from 'mssql';
import { MssqlError } from './MssqlError';

let pool: ConnectionPool;

export async function connectToDB(connectionConfig: config) {
  pool = await connect(connectionConfig);
}

export function getPool() {
  if (pool === undefined) throw new MssqlError('No MSSQL connection');
  return pool;
}

export function getTransaction() {
  return new Transaction(getPool());
}
