import { QueryRepository } from './QueryRepository';
import { Transaction } from 'mssql';

export * from 'mssql';

export * from './utils';

export { QueryRepository } from './QueryRepository';

export { MssqlError } from './errors/MssqlError';

export { MssqlSlowQueryError } from './errors/MssqlSlowQueryError';

export { Request } from './Request';

export function getRepository<T extends QueryRepository>(
  Repository: new () => T,
  transaction?: Transaction,
): T {
  const repository = new Repository();
  if (transaction) repository.setTransaction(transaction);
  return repository;
}
