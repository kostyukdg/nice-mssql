import { MssqlError } from './MssqlError';

export class MssqlSlowQueryError extends MssqlError {
  message = 'Slow query';
}
