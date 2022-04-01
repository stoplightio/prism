import { Logger } from 'pino';
export default function withLogger<T>(run: (E: Logger) => T): import("fp-ts/Reader").Reader<Logger, T>;
