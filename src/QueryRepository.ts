import { ConnectionPool, Transaction } from 'mssql';
import { getPool, getSlowQueryLogger, SlowQueryLogger } from './utils';
import { MssqlError } from './errors/MssqlError';
import { Request } from './Request';
import { MssqlSlowQueryError } from './errors/MssqlSlowQueryError';

export class QueryRepository {
  private pool: ConnectionPool = getPool();

  private transaction?: Transaction;

  /**
   * Max execution time for all slow queries in the instance
   * @protected
   */
  protected slowQueryMaxExecutionTime?: SlowQueryLogger['maxExecutionTime'];

  constructor(transaction?: Transaction) {
    if (transaction) this.setTransaction(transaction);
  }

  public setTransaction(transaction: Transaction) {
    this.transaction = transaction;
    return this;
  }

  public getTransaction(): Transaction {
    if (this.transaction === undefined)
      throw new MssqlError('No MSSQL transaction');
    return this.transaction;
  }

  public getRequest(
    slowQueryMaxExecutionTime?: SlowQueryLogger['maxExecutionTime'],
  ): Request {
    const request = this.transaction
      ? new Request(this.transaction)
      : new Request(this.pool);
    const slowQueryLogger = getSlowQueryLogger();
    if (slowQueryLogger) {
      request.setSlowQueryLogger({
        ...slowQueryLogger,
        maxExecutionTime:
          slowQueryMaxExecutionTime ??
          this.slowQueryMaxExecutionTime ??
          slowQueryLogger.maxExecutionTime,
      });
    } else if (
      !slowQueryLogger &&
      (slowQueryMaxExecutionTime !== undefined ||
        this.slowQueryMaxExecutionTime !== undefined)
    ) {
      throw new MssqlSlowQueryError('No MSSQL slow query logger');
    }
    return request;
  }
}
