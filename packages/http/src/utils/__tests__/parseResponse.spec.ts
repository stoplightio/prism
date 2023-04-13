import { parseResponse, parseResponseBody, parseResponseHeaders } from '../parseResponse';
import { assertResolvesLeft, assertResolvesRight } from '@stoplight/prism-core/src/__tests__/utils';
import { Headers } from 'node-fetch';

describe('parseResponseBody()', () => {
  describe('body is json', () => {
    describe('body is parseable', () => {
      it('returns parsed body', () => {
        const response = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
          text: jest.fn(),
          status: 200,
        };

        expect(response.text).not.toHaveBeenCalled();
        return assertResolvesRight(parseResponseBody(response), body => expect(body).toEqual({ test: 'test' }));
      });
    });

    describe('body is not parseable', () => {
      it('returns error', () => {
        const response = {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
          text: jest.fn(),
        };

        expect(response.text).not.toHaveBeenCalled();
        return assertResolvesLeft(parseResponseBody(response), error => expect(error.message).toEqual('Big Bada Boom'));
      });
    });
  });

  describe('body is not json', () => {
    describe('body is readable', () => {
      it('returns body text', () => {
        const response = {
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          json: jest.fn(),
          text: jest.fn().mockResolvedValue('<html>Test</html>'),
        };

        expect(response.json).not.toHaveBeenCalled();
        return assertResolvesRight(parseResponseBody(response), body => expect(body).toEqual('<html>Test</html>'));
      });
    });

    describe('body is not readable', () => {
      it('returns error', () => {
        const response = {
          status: 200,
          headers: new Headers(),
          json: jest.fn(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),

        };

        expect(response.json).not.toHaveBeenCalled();
        return assertResolvesLeft(parseResponseBody(response), error => expect(error.message).toEqual('Big Bada Boom'));
      });
    });
  });

  describe('content-type header not set', () => {
    it('returns body text', () => {
      const response = {
        status: 200,
        headers: new Headers(),
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Plavalaguna'),
      };

      expect(response.json).not.toHaveBeenCalled();
      return assertResolvesRight(parseResponseBody(response), body => expect(body).toEqual('Plavalaguna'));
    });
  });

  describe('content-type header is set', () => {
    it('does not call json() on 204', () => {
      const response = {
        status: 204,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(''),
      };

      expect(response.json).not.toHaveBeenCalled();
      return assertResolvesRight(parseResponseBody(response), body => expect(body).toEqual(''));
    });
  });
});

describe('parseResponseHeaders()', () => {
  it('parses raw headers correctly', () =>
    expect(parseResponseHeaders({ h1: ['a b'], h2: ['c'], h3: ['a', 'b'] })).toEqual({
      h1: 'a b',
      h2: 'c',
      h3: 'a,b',
    }));
});

describe('parseResponse()', () => {
  describe('response is correct', () => {
    it('returns parsed response', () =>
      assertResolvesRight(
        parseResponse({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json', test: 'test' }),
          json: jest.fn().mockResolvedValue({ test: 'test' }),
          text: jest.fn(),
        }),
        response => {
          expect(response).toEqual({
            statusCode: 200,
            headers: { 'content-type': 'application/json', test: 'test' },
            body: { test: 'test' },
          });
        }
      ));
  });

  describe('response is invalid', () => {
    it('returns error', () =>
      assertResolvesLeft(
        parseResponse({
          status: 200,
          headers: new Headers(),
          json: jest.fn(),
          text: jest.fn().mockRejectedValue(new Error('Big Bada Boom')),
        }),
        error => {
          expect(error.message).toEqual('Big Bada Boom');
        }
      ));
  });
});
