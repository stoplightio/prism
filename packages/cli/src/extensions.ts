import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { decycle } from '@stoplight/json';
import { get, forOwn } from 'lodash';
import { resetJSONSchemaGenerator, setJSONSchemaGeneratorOption } from '@stoplight/prism-http';

export async function configureExtensionsUserProvided(
  specFilePathOrObject: string | object,
  cliParamOptions: { [option: string]: any }
): Promise<void> {
  const result = decycle(await new $RefParser().dereference(specFilePathOrObject));

  resetJSONSchemaGenerator();

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    setJSONSchemaGeneratorOption(option, value);
  });

  // cli parameter takes precidence, so it is set after spec extensions are configed
  for (const param in cliParamOptions) {
    if (cliParamOptions[param] !== undefined) {
      setJSONSchemaGeneratorOption(param, cliParamOptions[param]);
    }
  }
}
