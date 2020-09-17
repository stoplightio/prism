import { HttpParamStyles } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from '../registry';
import { IHttpQueryParamStyleDeserializer } from '../types';

describe('HttpParamDeserializerRegistry', () => {
  const mockDeserializer = {
    deserialize: jest.fn(),
    supports: jest.fn(),
  } as IHttpQueryParamStyleDeserializer;
  const httpParamDeserializerRegistry = new HttpParamDeserializerRegistry([mockDeserializer]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deserializer for given style exists', () => {
    it('returns validation closure', () => {
      spyOn(mockDeserializer, 'supports').and.returnValue(true);
      spyOn(mockDeserializer, 'deserialize');

      const deserializer = httpParamDeserializerRegistry.get(HttpParamStyles.Form);
      if (!deserializer) {
        throw new Error('Expectation failed');
      }

      expect(deserializer.deserialize).toEqual(expect.any(Function));

      deserializer.deserialize('', {}, {});

      expect(mockDeserializer.deserialize).toHaveBeenCalled();
    });
  });
});
