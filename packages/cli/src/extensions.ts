import { get, camelCase, forOwn } from 'lodash';
import * as jsf from 'json-schema-faker';
import $RefParser = require('@stoplight/json-schema-ref-parser');

export async function configureExtensionsFromSpec(specFilePathOrObject: string | object): Promise<void> {
  const parser = new $RefParser();
  const result = await parser.dereference(specFilePathOrObject);

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
