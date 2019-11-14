import fetch from 'node-fetch';
import forward from '../index';
import { assertResolvesRight, assertResolvesLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { mapValues } from 'lodash';

jest.mock('node-fetch');

describe('forward', () => {
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
            method: 'post',
            body: { some: 'data' },
            url: { path: '/test' },
          },
          'http://example.com'
        ),
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
            method: 'post',
            body,
            url: { path: '/test' },
          },
          'http://example.com'
        )
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
            method: 'post',
            body: 'some body',
            headers,
            url: { path: '/test' },
          },
          'http://example.com'
        ),
        () => {
          expect(fetch).toHaveBeenCalledWith(
            'http://example.com/test',
            expect.objectContaining({ method: 'post', body: 'some body' })
          );
        }
      );
    });
  });
});
