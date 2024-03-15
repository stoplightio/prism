/* eslint-disable prettier/prettier */
import { Transform, TransformCallback } from 'stream';
import type { IncomingMessage } from 'http';
import { Socket } from 'net';

export type Options = {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  rawHeaders?: string[];
};

const BODYLESS_METHODS = ['GET', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'];

/*
 * A replacement for IncomingMessage when an HTTP request isn't comind directly
 * from a socket.
 * 
 * This class was inspired from https://github.com/diachedelic/mock-req.
 */
export class FakeIncomingMessage extends Transform implements IncomingMessage {
  private _failError: unknown;

  /** GET, PUT, POST, DELETE, OPTIONS, HEAD, etc. */
  public method: string;

  public url: string;
  public headers: {};
  public rawHeaders: string[] = [];

  constructor(options: Options) {
    super();
    options = options || {};

    Transform.call(this);
    this.method = options.method?.toUpperCase() || 'GET';
    this.url = options.url || '';

    // Set header names
    this.headers = {};
    this.rawHeaders = [];
    const headers = options.headers;
    if (headers !== undefined && headers !== null) {
      Object.keys(headers).forEach(key => {
        let val = headers[key];

        if (val !== undefined) {
          if (typeof val !== 'string') {
            val = String(val);
          }

          this.headers[key.toLowerCase()] = val;

          // Yep, this is weird!  See https://nodejs.org/api/http.html#messagerawheaders
          this.rawHeaders.push(key);
          this.rawHeaders.push(val);
        }
      });
    }

    if (BODYLESS_METHODS.includes(this.method)) {
      this.end();
    }
  }

  _transform(chunk: any, _encoding: string, callback: TransformCallback): void {
    if (this._failError) {
      this.emit('error', this._failError);
      return;
    }

    if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
      chunk = JSON.stringify(chunk);
    }

    this.push(chunk);
    callback();
  }

  _fail(error: unknown): void {
    this._failError = error;
  }

  // The remaining aspects of IncomingMessage are intentionally NOT implemented.
  get aborted(): boolean { throw notImplemented(); }
  set aborted(_: boolean) { throw notImplemented(); }
  get httpVersion(): string { throw notImplemented(); }
  set httpVersion(_: string) { throw notImplemented(); }
  get httpVersionMajor(): number { throw notImplemented(); }
  set httpVersionMajor(_: number) { throw notImplemented(); }
  get httpVersionMinor(): number { throw notImplemented(); }
  set httpVersionMinor(_: number) { throw notImplemented(); }
  get complete(): boolean { throw notImplemented(); }
  set complete(_: boolean) { throw notImplemented(); }
  get connection(): Socket { throw notImplemented(); }
  set connection(_: Socket) { throw notImplemented(); }
  get socket(): Socket { throw notImplemented(); }
  set socket(_: Socket) { throw notImplemented(); }
  get trailers(): NodeJS.Dict<string> { throw notImplemented(); }
  set trailers(_: NodeJS.Dict<string>) { throw notImplemented(); }
  get rawTrailers(): string[] { throw notImplemented(); }
  set rawTrailers(_: string[]) { throw notImplemented(); }
  get statusCode(): number { throw notImplemented(); }
  set statusCode(_: number) { throw notImplemented(); }
  get statusMessage(): string { throw notImplemented(); }
  set statusMessage(_: string) { throw notImplemented(); }
  setTimeout(): this { throw notImplemented(); }
}

function notImplemented(): Error {
  return new Error('method not implemented');
}
