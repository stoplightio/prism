import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import { serializeBody } from '../serializeBody';

describe('serializeBody()', () => {
  describe('when body is a string', () => {
    it('passes through', () => {
      assertRight(
        serializeBody('Beware, I am a string!'),
        result => expect(result).toEqual('Beware, I am a string!')
      );
    });
  });

  describe('when body is an object', () => {
    it('serializes to string', () => {
      assertRight(
        serializeBody({ beware: 'I am a string!' }),
        result => expect(result).toEqual('{"beware":"I am a string!"}')
      );
    });
  });

  describe('when body is a circular object', () => {
    it('fails with proper message', () => {
      const body = { x: {} };
      body.x = { y: body };

      assertLeft(serializeBody(body));
    })
  });

  describe('when body is undefined', () => {
    it('passes through', () => {
      assertRight(
        serializeBody(undefined),
        result => expect(result).toBeUndefined(),
      );
    })
  });
});
