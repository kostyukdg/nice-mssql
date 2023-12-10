import { ConnectionPool, Transaction } from 'mssql';
import { getPool } from './utils';
import { MssqlError } from './MssqlError';
import { Request } from './Request';

export class QueryRepository {
  private pool: ConnectionPool = getPool();

  private transaction?: Transaction;

  public setTransaction(transaction: Transaction) {
    this.transaction = transaction;
    return this;
  }

  public getTransaction(): Transaction {
    if (this.transaction === undefined)
      throw new MssqlError('No MSSQL transaction');
    return this.transaction;
  }

  public getRequest(): Request {
    return this.transaction
      ? new Request(this.transaction)
      : new Request(this.pool);
  }
}
