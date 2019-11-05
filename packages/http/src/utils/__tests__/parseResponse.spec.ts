import { parseResponse, parseResponseBody, parseResponseHeaders } from '../parseResponse';
import { assertResolvesLeft, assertResolvesRight } from '@stoplight/prism-core/src/__tests__/utils';
import { Headers } from 'node-fetch';

describe('parseResponseBody()', () => {
  describe('body is json', () => {
    describe('body is parseable', () => {
      it('returns parsed body', async () => {
        const response = {
          headers: new Headers({'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
          text: jest.fn(),
        };

        await assertResolvesRight(
          parseResponseBody(response),
          body => expect(body).toEqual({ test: 'test' }),
        );

        expect(response.text).not.toHaveBeenCalled();
      });
    });

    describe('body is not parseable', () => {
      it('returns error', async () => {
        const response = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
          text: jest.fn(),
        };

        await assertResolvesLeft(
          parseResponseBody(response),
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
          headers: new Headers({ 'content-type': 'text/html' }),
          json: jest.fn(),
          text: jest.fn().mockResolvedValue('<html>Test</html>'),
        };

        await assertResolvesRight(
          parseResponseBody(response),
          body => expect(body).toEqual('<html>Test</html>'),
        );

        expect(response.json).not.toHaveBeenCalled();
      });
    });

    describe('body is not readable', () => {
      it('returns error', async () => {
        const response = {
          headers: new Headers(),
          json: jest.fn(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
        };

        await assertResolvesLeft(
          parseResponseBody(response),
          error => expect(error.message).toEqual('Big Bada Boom'),
        );

        expect(response.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('content-type header not set', () => {
    it('returns body text', async () => {
      const response = {
        headers: new Headers(),
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Plavalaguna'),
      };

      await assertResolvesRight(
        parseResponseBody(response),
        body => expect(body).toEqual('Plavalaguna'),
      );

      expect(response.json).not.toHaveBeenCalled();
    });
  });
});

describe('parseResponseHeaders()', () => {
  it('parses raw headers correctly', () => {
    expect(parseResponseHeaders({ headers: new Headers({ h1: 'a b', h2: 'c' }) }))
      .toEqual({ h1: 'a b', h2: 'c' });
  });
});

describe('parseResponse()', () => {
  describe('response is correct', () => {
    it('returns parsed response', () => {
      return assertResolvesRight(
        parseResponse({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json', 'test': 'test' }),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
          text: jest.fn(),
        }),
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
    it('returns error', () => {
      return assertResolvesLeft(
        parseResponse({
          status: 200,
          headers: new Headers(),
          json: jest.fn(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
        }),
        error => {
          expect(error.message).toEqual('Big Bada Boom');
        }
      );
    })
  });
});
