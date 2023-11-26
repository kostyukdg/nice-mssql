import {
  Request as RequestOriginal,
  MSSQLError as MSSQLErrorOriginal,
  Table,
} from 'mssql';
import { MssqlError } from './MssqlError';

export class Request extends RequestOriginal {
  static async errorWrapper<T>(callback: () => Promise<T>) {
    try {
      return await callback();
    } catch (_error: unknown) {
      let error = _error;
      if (_error instanceof MSSQLErrorOriginal) {
        error = new MssqlError(_error.message);
      }
      if (error instanceof Error)
        Error.captureStackTrace(error, Request.errorWrapper);
      throw error;
    }
  }

  // @ts-expect-error Multiple overrides problems
  public async query(command: string) {
    return Request.errorWrapper(async () => super.query(command));
  }

  public async bulk(table: Table) {
    return Request.errorWrapper(async () => super.bulk(table));
  }
}
