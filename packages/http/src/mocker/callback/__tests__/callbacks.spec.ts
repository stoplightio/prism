import fetch from 'node-fetch';
import { runCallback } from '../callbacks';
import { assertLeft, assertRight } from '../../../__tests__/utils';
import { mapValues } from 'lodash';

jest.mock('node-fetch');

describe('runCallback()', () => {
  const logger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };


  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callback invocation was correct', () => {
    it('works', async () => {
      const headers = { 'content-type': 'application/json', 'test': 'test' };
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        status: 200,
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({ test: 'test' }),
      } as any);

      assertRight(await runCallback({
          callback: {
            callbackName: 'test callback',
            method: 'get',
            path: 'http://some-distant-remote-address.com/{$method}/{$statusCode}/{$response.body#/id}/{$request.header.content-type}',
            id: '1',
            responses: [{ code: '200' }]
          },
          request: {
            body: '',
            headers: {
              'content-type': 'weird/content',
            },
            method: 'get',
            url: { path: '/subscribe' },
          },
          response: {
            statusCode: 200,
            body: { id: 5 }
          },
        })(logger)(),
        () => expect(fetch).toHaveBeenCalledWith('http://some-distant-remote-address.com/get/200/5/weird/content', { 'method': 'get' })
      );
    });
  });

  describe('callback invocation was not correct', () => {
    it('works', async () => {
      ((fetch as unknown) as jest.Mock).mockRejectedValue(new Error('Test'));

      assertLeft(await runCallback({
          callback: {
            callbackName: 'test callback',
            method: 'get',
            path: 'http://some-distant-remote-address.com/{$method}/{$statusCode}/{$response.body#/id}/{$request.header.content-type}',
            id: '1',
            responses: [
              { code: '200' }
            ]
          },
          request: {
            body: '',
            headers: {
              'content-type': 'weird/content',
            },
            method: 'get',
            url: {
              path: '/subscribe'
            },
          },
          response: {
            statusCode: 200,
            body: {
              id: 5,
            }
          },
        })(logger)(),
        (error) => expect(((error as unknown) as Error)/* todo: wtf? */.message).toEqual('Test'),
      );
    });
  });
});
