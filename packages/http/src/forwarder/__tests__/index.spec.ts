import fetch from 'node-fetch';
import forward from '../index';
import { assertResolvesRight, assertResolvesLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { keyBy, mapValues } from 'lodash';
import { hopByHopHeaders } from '../resources';
import { DiagnosticSeverity } from '@stoplight/types';

jest.mock('node-fetch');

describe('forward', () => {
  const logger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  describe('when POST method with json body', () => {
    it('forwards request to upstream', () => {
      const headers = { 'content-type': 'application/json' };

      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
      });

      return assertResolvesRight(
        forward(
          {
            validations: [],
            data: {
              method: 'post',
              body: { some: 'data' },
              url: { path: '/test' },
            },
          },
          'http://example.com'
        )(logger),
        () => {
          expect(fetch).toHaveBeenCalledWith(
            'http://example.com/test',
            expect.objectContaining({ method: 'post', body: '{"some":"data"}' })
          );
        }
      );
    });
  });

  describe('when POST method with circular json body', () => {
    it('will fail and blame you', () => {
      const headers = { 'content-type': 'application/json' };

      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn(),
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
          'http://example.com'
        )(logger)
      );
    });
  });

  describe('when POST method with string body', () => {
    it('forwards request to upstream', () => {
      const headers = { 'content-type': 'text/plain' };

      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(''),
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
          'http://example.com'
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

      ((fetch as unknown) as jest.Mock).mockReturnValue({
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        text: jest.fn().mockResolvedValue(''),
      });

      return assertResolvesRight(
        forward({ validations: [], data: { method: 'get', url: { path: '/test' } } }, 'http://example.com')(logger),
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
          'http://example.com'
        )(logger),
        e => expect(e).toHaveProperty('status', 422)
      ));
  });
});
