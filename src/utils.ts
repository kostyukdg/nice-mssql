import {
  connect,
  ConnectionPool,
  Transaction,
  config as configOriginal,
} from 'mssql';
import { MssqlError } from './errors/MssqlError';
import { Request } from './Request';
import { MssqlSlowQueryError } from './errors/MssqlSlowQueryError';
import { QueryRepository } from './QueryRepository';

export interface SlowQueryLogger {
  maxExecutionTime: number;
  logger: (
    error: MssqlSlowQueryError,
    executionTime: number,
  ) => Promise<void> | void;
}

export interface Config extends configOriginal {
  slowQueryLogger?: SlowQueryLogger;
}

let pool: ConnectionPool | undefined;
let slowQueryLogger: SlowQueryLogger | undefined;

export async function connectToMssql(connectionConfig: Config) {
  let config = connectionConfig;
  if (connectionConfig.slowQueryLogger) {
    slowQueryLogger = connectionConfig.slowQueryLogger;
    config = { ...config, slowQueryLogger: undefined };
  }
  pool = await connect(config);
}

export function getPool() {
  if (pool === undefined) throw new MssqlError('No MSSQL connection');
  return pool;
}

export async function closeMssqlConnection() {
  if (pool === undefined) throw new MssqlError('No MSSQL connection');
  await pool.close();
}

export function getRepository<T extends QueryRepository>(
  Repository: new () => T,
  transaction?: Transaction,
): T {
  const repository = new Repository();
  if (transaction) repository.setTransaction(transaction);
  return repository;
}

export function getTransaction() {
  return new Transaction(getPool());
}

export function getSlowQueryLogger() {
  return slowQueryLogger;
}

export function getRequest(
  transaction?: Transaction,
  slowQueryMaxExecutionTime?: number,
) {
  const request = transaction
    ? new Request(transaction)
    : new Request(getPool());
  if (slowQueryMaxExecutionTime) {
    if (!slowQueryLogger) {
      throw new MssqlSlowQueryError('No MSSQL slow query logger');
    }
    request.setSlowQueryLogger({
      ...slowQueryLogger,
      maxExecutionTime: slowQueryMaxExecutionTime,
    });
  }
  return request;
}
