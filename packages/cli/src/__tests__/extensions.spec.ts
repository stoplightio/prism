import { IHttpOperation } from '@stoplight/types';
import { JSONSchema } from '@stoplight/prism-http/src/types';
import { assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import { generate, resetGenerator } from '@stoplight/prism-http/src/mocker/generator/JSONSchema';
import { configureExtensionsUserProvided } from '../extensions';

describe('configureExtensionsUserProvided()', () => {
  const operation = {} as IHttpOperation;
  // A single optional property is the shape json-schema-faker pads with random extra properties.
  const schema: JSONSchema = { type: 'object', properties: { status: { type: 'string' } } };
  const spec = (extensions: Record<string, unknown>) => ({
    openapi: '3.0.0',
    info: { title: 'test', version: '1.0.0' },
    paths: {},
    ...extensions,
  });

  afterEach(() => resetGenerator());

  function expectOnlyDeclaredProperties() {
    for (let i = 0; i < 25; i++) {
      assertRight(generate(operation, {}, schema), instance => {
        expect(Object.keys(instance as object)).toEqual(['status']);
      });
    }
  }

  describe('useDefaultValue coupling to fillProperties', () => {
    const schemaWithDefault: JSONSchema = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string', default: 'from-default' } },
    };

    const generatedName = () => {
      let name: unknown;
      assertRight(generate(operation, {}, schemaWithDefault), instance => {
        name = (instance as { name: unknown }).name;
      });
      return name;
    };

    it('uses schema defaults while fillProperties is disabled', async () => {
      await configureExtensionsUserProvided(spec({}), { fillProperties: false });

      expect(generatedName()).toBe('from-default');
    });

    it('stops using schema defaults when the CLI re-enables fillProperties', async () => {
      await configureExtensionsUserProvided(spec({ 'x-json-schema-faker': { fillProperties: false } }), {
        fillProperties: true,
      });

      expect(generatedName()).not.toBe('from-default');
    });

    it('keeps an explicit useDefaultValue when fillProperties changes', async () => {
      await configureExtensionsUserProvided(
        spec({ 'x-json-schema-faker': { useDefaultValue: true, fillProperties: false } }),
        { fillProperties: true }
      );

      expect(generatedName()).toBe('from-default');
    });
  });

  it('applies x-json-schema-faker options to the generator prism-http uses', async () => {
    await configureExtensionsUserProvided(spec({ 'x-json-schema-faker': { fillProperties: false } }), {});

    expectOnlyDeclaredProperties();
  });

  it('applies CLI parameters to the generator prism-http uses', async () => {
    await configureExtensionsUserProvided(spec({}), { fillProperties: false });

    expectOnlyDeclaredProperties();
  });

  it('lets CLI parameters take precedence over x-json-schema-faker', async () => {
    await configureExtensionsUserProvided(spec({ 'x-json-schema-faker': { fillProperties: true } }), {
      fillProperties: false,
    });

    expectOnlyDeclaredProperties();
  });
});
