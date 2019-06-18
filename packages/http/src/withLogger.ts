import { Reader } from 'fp-ts/lib/Reader';
import { Logger } from 'pino';

export default function withLogger<T>(run: (E: Logger) => T) {
  return new Reader<Logger, T>(run);
}
