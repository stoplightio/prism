import { parseResponse, parseResponseBody, parseResponseHeaders } from '../parseResponse';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/utils/__tests__/utils';
import { Headers } from 'node-fetch';

describe('parseResponseBody()', () => {
  describe('body is json', () => {
    describe('body is parseable', () => {
      it('returns parsed body', async () => {
        const response = {
          headers: new Map([['content-type', 'application/json']]),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
          text: jest.fn(),
        } as any;

        assertRight(
          await parseResponseBody(response)(),
          body => expect(body).toEqual({ test: 'test' }),
        );

        expect(response.text).not.toHaveBeenCalled();
      });
    });

    describe('body is not parseable', () => {
      it('returns error', async () => {
        const response = {
          headers: new Map([['content-type', 'application/json']]),
          json: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
          text: jest.fn(),
        } as any;

        assertLeft(
          await parseResponseBody(response)(),
          error => expect(error.message).toEqual('Big Bada Boom'),
        );

        expect(response.text).not.toHaveBeenCalled();
      });
    })
  });

  describe('body is not json', () => {
    describe('body is readable', () => {
      it('returns body text', async () => {
        const response = {
          headers: new Map([['content-type', 'text/html']]),
          json: jest.fn(),
          text: jest.fn().mockResolvedValue('<html>Test</html>'),
        } as any;

        assertRight(
          await parseResponseBody(response)(),
          body => expect(body).toEqual('<html>Test</html>'),
        );

        expect(response.json).not.toHaveBeenCalled();
      });
    });

    describe('body is not readable', () => {
      it('returns error', async () => {
        const response = {
          headers: new Map(),
          json: jest.fn(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
        } as any;

        assertLeft(
          await parseResponseBody(response)(),
          error => expect(error.message).toEqual('Big Bada Boom'),
        );

        expect(response.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('content-type header not set', () => {
    it('returns body text', async () => {
      const response = {
        headers: new Map(),
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Plavalaguna'),
      } as any;

      assertRight(
        await parseResponseBody(response)(),
        body => expect(body).toEqual('Plavalaguna'),
      );

      expect(response.json).not.toHaveBeenCalled();
    });
  });
});

describe('parseResponseHeaders()', () => {
  it('parses raw headers correctly', () => {
    expect(parseResponseHeaders({ headers: { raw: () => ({ h1: ['a', 'b'], h2: ['c']}) } } as any))
      .toEqual({ h1: 'a b', h2: 'c' });
  });
});

describe('parseResponse()', () => {
  describe('response is correct', () => {
    it('returns parsed response', async () => {
      assertRight(
        await parseResponse({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json', 'test': 'test' }),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
        } as any)(),
        response => {
          expect(response).toEqual({
            statusCode: 200,
            headers: { 'content-type': 'application/json', 'test': 'test' },
            body: { test: 'test' }
          });
        }
      );
    });
  });

  describe('response is invalid', () => {
    it('returns error', async () => {
      assertLeft(
        await parseResponse({
          status: 200,
          headers: new Headers(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
        } as any)(),
        error => {
          expect(error.message).toEqual('Big Bada Boom');
        }
      );
    })
  });
});
