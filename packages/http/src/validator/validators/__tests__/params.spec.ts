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
    // TODO: Once all the tests are fixed and passing, see if we
    // couldn't just return an empty object "{}"
    expect(createJsonSchemaFromParams(specs)).toEqual({
      required: [],
      type: 'object',
    });
  });
});
