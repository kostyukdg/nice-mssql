import {
  Request as RequestOriginal,
  MSSQLError as MSSQLErrorOriginal,
  Table,
  IResult,
  ISqlType,
} from 'mssql';
import { MssqlError } from './errors/MssqlError';
import { SlowQueryLogger } from './utils';
import { MssqlSlowQueryError } from './errors/MssqlSlowQueryError';

type RequestExecutionMethod =
  | typeof Request.prototype.query
  | typeof Request.prototype.bulk;

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

async function logSlowQuery<T>(
  callback: () => Promise<T>,
  calledMethod: RequestExecutionMethod,
  { maxExecutionTime, logger }: SlowQueryLogger,
) {
  const error = new MssqlSlowQueryError();
  Error.captureStackTrace(error, calledMethod);
  const startTime = Date.now();
  try {
    return await callback();
  } finally {
    const executionTime = Date.now() - startTime;
    if (executionTime > maxExecutionTime) {
      logger(error, executionTime);
    }
  }
}

export class Request extends RequestOriginal {
  private slowQueryLogger?: SlowQueryLogger;

  public setSlowQueryLogger(slowQueryLogger: SlowQueryLogger) {
    this.slowQueryLogger = slowQueryLogger;
    return this;
  }

  public getSlowQueryLogger() {
    return this.slowQueryLogger;
  }

  public setSlowQueryMaxExecutionTime(
    maxExecutionTime: SlowQueryLogger['maxExecutionTime'],
  ) {
    const slowQueryLogger = this.getSlowQueryLogger();
    if (!slowQueryLogger) {
      throw new MssqlError('No MSSQL slow query logger');
    }
    return this.setSlowQueryLogger({
      ...slowQueryLogger,
      maxExecutionTime,
    });
  }

  private executeMethod<T>(
    callback: () => Promise<T>,
    calledMethod: RequestExecutionMethod,
  ) {
    const { slowQueryLogger } = this;
    if (slowQueryLogger) {
      return wrapError(() =>
        logSlowQuery(callback, calledMethod, slowQueryLogger),
      );
    }
    return wrapError(callback);
  }

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
      return this.executeMethod(
        () => super.query(command),
        Request.prototype.query,
      );
    }
    return this.executeMethod(
      () => super.query(command, ...interpolations),
      Request.prototype.query,
    );
  }

  public bulk(table: Table) {
    return this.executeMethod(() => super.bulk(table), Request.prototype.bulk);
  }

  public parametrizeInClause(
    name: string,
    type: (() => ISqlType) | ISqlType,
    values: unknown[],
  ): string {
    return values
      .map((value, index) => {
        const parameter = `${name}${index}`;
        super.input(parameter, type, value);
        return `@${parameter}`;
      })
      .join(',');
  }
}
