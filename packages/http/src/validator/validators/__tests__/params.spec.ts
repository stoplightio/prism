import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { createJsonSchemaFromParams } from '../params';

describe('createJsonSchemaFromParams', () => {
  it('basic use case', () => {
    const specs = [{ name: 'aHeader', style: HttpParamStyles.Simple, required: true }];
    expect(createJsonSchemaFromParams(specs)).toEqual({
      properties: {},
      required: ['aheader'],
      type: 'object',
    });
  });

  it('empty use case', () => {
    const specs: IHttpPathParam[] = [];
    expect(createJsonSchemaFromParams(specs)).toEqual({
      required: [],
      type: 'object',
    });
  });
});
