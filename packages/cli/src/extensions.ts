import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { decycle } from '@stoplight/json';
import { get, camelCase, forOwn } from 'lodash';
import { faker } from '@faker-js/faker';
import { resetJSONSchemaGenerator, setJSONSchemaGeneratorOption } from '@stoplight/prism-http';

export async function configureExtensionsUserProvided(
  specFilePathOrObject: string | object,
  cliParamOptions: { [option: string]: any }
): Promise<void> {
  const result = decycle(await new $RefParser().dereference(specFilePathOrObject));

  resetJSONSchemaGenerator();

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    setFakerValue(option, value);
  });

  // cli parameter takes precidence, so it is set after spec extensions are configed
  for (const param in cliParamOptions) {
    if (cliParamOptions[param] !== undefined) {
      setFakerValue(param, cliParamOptions[param]);
    }
  }
}

function setFakerValue(option: string, value: any) {
  if (option === 'locale') {
    faker.locale = value;
    return;
  }
  setJSONSchemaGeneratorOption(camelCase(option), value);
}
