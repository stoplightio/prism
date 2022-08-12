import { dereference } from '@stoplight/json-schema-ref-parser';
import { decycle } from '@stoplight/json';
import { get, camelCase, forOwn } from 'lodash';
import * as jsf from 'json-schema-faker';

export async function configureExtensionsFromSpec(specFilePathOrObject: string | object): Promise<void> {
  const result = decycle(await dereference(specFilePathOrObject));

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    if (option === 'locale') {
      // necessary as workaround broken types in json-schema-faker
      // @ts-ignore
      return jsf.locate('faker').setLocale(value);
    }

    // necessary as workaround broken types in json-schema-faker
    // @ts-ignore
    jsf.option(camelCase(option), value);
  });
}
