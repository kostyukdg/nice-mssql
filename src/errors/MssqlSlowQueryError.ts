import { MssqlError } from './MssqlError';

export class MssqlSlowQueryError extends MssqlError {
  constructor(message = 'Slow query') {
    super(message);
  }
}
