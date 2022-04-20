import fetch from 'node-fetch';
import forward from '../index';
import { assertResolvesRight, assertResolvesLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { keyBy, mapValues } from 'lodash';
import { hopByHopHeaders } from '../resources';
import { DiagnosticSeverity, Dictionary } from '@stoplight/types';

jest.mock('node-fetch');

function stubFetch({ json = {}, text = '', headers }: { headers: Dictionary<string>; text?: string; json?: unknown }) {
  (fetch as unknown as jest.Mock).mockResolvedValue({
    headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
    json: jest.fn().mockResolvedValue(json),
    text: jest.fn().mockResolvedValue(text),
  });
}

describe('forward', () => {
  const logger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  describe('when POST method with json body', () => {
    it('forwards request to upstream', () => {
      stubFetch({
        headers: { 'content-type': 'application/json' },
      });

      return assertResolvesRight(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              body: { some: 'data' },
              url: {
                path: '/test',
                query: {
                  x: ['1', 'a'],
                  y: '3',
                },
              },
            },
          },
          'http://example.com',
          undefined
        )(logger),
        () => {
          expect(fetch).toHaveBeenCalledWith(
            'http://example.com/test?x=1&x=a&y=3',
            expect.objectContaining({ method: 'post', body: '{"some":"data"}' })
          );
        }
      );
    });
  });

  describe('when POST method with circular json body', () => {
    it('will fail and blame you', () => {
      stubFetch({
        headers: { 'content-type': 'application/json' },
      });

      const body = { x: {} };
      body.x = { y: body };

      return assertResolvesLeft(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              body,
              url: { path: '/test' },
            },
          },
          'http://example.com',
          undefined
        )(logger)
      );
    });
  });

  describe('when POST method with string body', () => {
    it('forwards request to upstream', () => {
      const headers = { 'content-type': 'text/plain' };
      stubFetch({
        headers,
      });

      return assertResolvesRight(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              body: 'some body',
              headers,
              url: { path: '/test' },
            },
          },
          'http://example.com',
          undefined
        )(logger),
        () => {
          expect(fetch).toHaveBeenCalledWith(
            'http://example.com/test',
            expect.objectContaining({ method: 'post', body: 'some body' })
          );
        }
      );
    });
  });

  describe('when upstream return hop-by-hop headers', () => {
    it('forwarder strips them all', () => {
      const headers = mapValues(keyBy(hopByHopHeaders), () => 'n/a');

      stubFetch({
        headers,
      });

      return assertResolvesRight(
        forward(
          { validations: [], data: { method: 'get', url: { path: '/test' } } },
          'http://example.com',
          undefined
        )(logger),
        r =>
          hopByHopHeaders.forEach(hopHeader => {
            expect(r.headers?.[hopHeader]).toBeUndefined();
          })
      );
    });
  });

  describe('and there are input validation errors', () => {
    it('will refuse to forward and return an error', () =>
      assertResolvesLeft(
        forward(
          {
            validations: [{ code: 1, message: 'Hello', severity: DiagnosticSeverity.Error }],
            data: {
              method: 'post',
              url: { path: '/test' },
            },
          },
          'http://example.com',
          undefined
        )(logger),
        e => expect(e).toHaveProperty('status', 422)
      ));
  });

  describe('and operation is marked as deprecated', () => {
    it('will add "Deprecation" header if not present in response', () => {
      stubFetch({
        headers: { 'content-type': 'text/plain' },
      });

      assertResolvesRight(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              url: { path: '/test' },
            },
          },
          'http://example.com',
          undefined,
          {
            deprecated: true,
            method: 'post',
            path: '/test',
            responses: [],
            id: 'test',
          }
        )(logger),
        e => expect(e.headers).toHaveProperty('deprecation', 'true')
      );
    });

    it('will omit "Deprecation" header if already defined in response', () => {
      stubFetch({ headers: { 'content-type': 'text/plain', deprecation: 'foo' } });

      assertResolvesRight(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              url: { path: '/test' },
            },
          },
          'http://example.com',
          undefined,
          {
            deprecated: true,
            method: 'post',
            path: '/test',
            responses: [],
            id: 'test',
          }
        )(logger),
        e => expect(e.headers).toHaveProperty('deprecation', 'foo')
      );
    });
  });
});
