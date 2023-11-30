import { BaseRepository } from './BaseRepository';
import { Transaction } from 'mssql';

export * from 'mssql';

export * from './utils';

export { BaseRepository } from './BaseRepository';

export { MssqlError } from './MssqlError';

export { Request } from './Request';

export function getRepository<T extends BaseRepository>(
  Repository: new () => T,
  transaction?: Transaction,
): T {
  const repository = new Repository();
  if (transaction) repository.setTransaction(transaction);
  return repository;
}
