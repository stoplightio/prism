import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { decycle } from '@stoplight/json';
import { get, camelCase, forOwn } from 'lodash';
import * as JSONSchemaFaker from 'json-schema-faker';
import type { JSONSchemaFakerOptions } from 'json-schema-faker';
import { resetJSONSchemaGenerator } from '@stoplight/prism-http';

export async function configureExtensionsFromSpec(specFilePathOrObject: string | object): Promise<void> {
  const result = decycle(await new $RefParser().dereference(specFilePathOrObject));

  resetJSONSchemaGenerator();

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    if (option === 'locale') {
      // necessary as workaround broken types in json-schema-faker
      // @ts-ignore
      return JSONSchemaFaker.locate('faker').setLocale(value);
    }

    // necessary as workaround broken types in json-schema-faker
    // @ts-ignore
    JSONSchemaFaker.option(camelCase(option) as keyof JSONSchemaFakerOptions, value);
  });
}
