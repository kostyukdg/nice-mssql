import {
  Request as RequestOriginal,
  MSSQLError as MSSQLErrorOriginal,
  Table,
  Promise,
  IResult,
} from 'mssql';
import { MssqlError } from './MssqlError';

async function wrapError<T>(callback: () => Promise<T>) {
  try {
    return await callback();
  } catch (_error: unknown) {
    let error = _error;
    if (_error instanceof MSSQLErrorOriginal) {
      error = new MssqlError(_error.message);
    }
    if (error instanceof Error) Error.captureStackTrace(error, wrapError);
    throw error;
  }
}

export class Request extends RequestOriginal {
  public query<Entity>(command: string): Promise<IResult<Entity>>;
  public query<Entity>(
    command: TemplateStringsArray,
    ...interpolations: never[]
  ): Promise<IResult<Entity>>;
  public query(
    command: TemplateStringsArray | string,
    ...interpolations: never[]
  ) {
    if (typeof command === 'string') {
      return wrapError(() => super.query(command));
    }
    return wrapError(() => super.query(command, ...interpolations));
  }

  public bulk(table: Table) {
    return wrapError(() => super.bulk(table));
  }
}
