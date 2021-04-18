import fetch from 'node-fetch';
import { runCallback } from '../callbacks';
import { mapValues } from 'lodash';
import { HttpParamStyles } from '@stoplight/types';

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
    it('runs without logging violations', async () => {
      const headers = { 'content-type': 'application/json' };
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        status: 200,
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({ test: 'test' }),
      } as any);

      await runCallback({
        callback: {
          callbackName: 'test callback',
          method: 'get',
          path: 'http://example.com/{$method}/{$statusCode}/{$response.body#/id}/{$request.header.content-type}',
          id: '1',
          responses: [{ code: '200', contents: [{ mediaType: 'application/json' }] }],
          request: {
            body: {
              contents: [
                {
                  mediaType: 'application/json',
                  examples: [{ key: 'e1', value: { about: 'something' } }],
                },
              ],
            },
          },
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
          body: { id: 5 },
        },
      })(logger)();

      expect(fetch).toHaveBeenCalledWith('http://example.com/get/200/5/weird/content', {
        method: 'get',
        body: '{"about":"something"}',
        headers: { 'content-type': 'application/json' },
      });
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        { name: 'CALLBACK' },
        'test callback: Making request to http://example.com/get/200/5/weird/content...'
      );
      expect(logger.info).toHaveBeenNthCalledWith(2, { name: 'CALLBACK' }, 'test callback: Request finished');
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('callback response is incorrect', () => {
    it('logs violations', async () => {
      const headers = { 'content-type': 'application/json', test: 'test' };
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        status: 200,
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({ test: 'test' }),
      } as any);

      await runCallback({
        callback: {
          callbackName: 'test callback',
          method: 'get',
          path: 'http://example.com/{$method}/{$statusCode}/{$response.body#/id}/{$request.header.content-type}',
          id: '1',
          responses: [
            {
              code: '200',
              headers: [
                {
                  name: 'test',
                  style: HttpParamStyles.Simple,
                  deprecated: true,
                  schema: { type: 'string', enum: ['a'] },
                },
              ],
              contents: [
                {
                  mediaType: 'application/json',
                  schema: { type: 'object', properties: { test: { type: 'string', maxLength: 3 } } },
                },
              ],
            },
          ],
          request: {
            body: {
              contents: [
                {
                  mediaType: 'application/json',
                  examples: [{ key: 'e1', value: { about: 'something' } }],
                },
              ],
            },
          },
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
          body: { id: 5 },
        },
      })(logger)();

      expect(fetch).toHaveBeenCalledWith('http://example.com/get/200/5/weird/content', {
        method: 'get',
        body: '{"about":"something"}',
        headers: { 'content-type': 'application/json' },
      });
      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        { name: 'VALIDATOR' },
        'Violation: header.test Header param test is deprecated'
      );
      expect(logger.error).toHaveBeenNthCalledWith(
        1,
        { name: 'VALIDATOR' },
        'Violation: body.test must NOT have more than 3 characters'
      );
      expect(logger.error).toHaveBeenNthCalledWith(
        2,
        { name: 'VALIDATOR' },
        'Violation: header.test must be equal to one of the allowed values: a'
      );
    });
  });

  describe('callback request defines neither body nor headers', () => {
    it('makes request without body and headers', async () => {
      const headers = { 'content-type': 'application/json' };
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        status: 200,
        headers: { get: (n: string) => headers[n], raw: () => mapValues(headers, (h: string) => h.split(' ')) },
        json: jest.fn().mockResolvedValue({ test: 'test' }),
      } as any);

      await runCallback({
        callback: {
          callbackName: 'test callback',
          method: 'get',
          path: 'http://example.com/{$method}/{$statusCode}/{$response.body#/id}/{$request.header.content-type}',
          id: '1',
          responses: [{ code: '200' }],
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
          body: { id: 5 },
        },
      })(logger)();

      expect(fetch).toHaveBeenCalledWith('http://example.com/get/200/5/weird/content', { method: 'get' });
    });
  });
});
