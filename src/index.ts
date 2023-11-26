import { Base } from './Base';
import { Transaction } from 'mssql';

export * from 'mssql';

export * from './utils';

export function getTable<T extends Base>(
  Entity: new () => T,
  transaction?: Transaction,
): T {
  const entity = new Entity();
  if (transaction) entity.setTransaction(transaction);
  return entity;
}

export { Base } from './Base';

export { MssqlError } from './MssqlError';

export { Request } from './Request';
