import { DiagnosticSeverity } from '@stoplight/types';
import { right } from 'fp-ts/lib/Either';
import { configMergerFactory, PartialPrismConfig, PrismConfig } from '.';
import {
  IPrism,
  IPrismComponents,
  IPrismConfig,
  IPrismDiagnostic,
  IPrismOutput,
  PickRequired,
  ProblemJsonError,
} from './types';

export function factory<Resource, Input, Output, Config, LoadOpts>(
  defaultConfig: PrismConfig<Config, Input>,
  defaultComponents: Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>,
): (
  customConfig?: PartialPrismConfig<Config, Input>,
  customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>, 'logger'>,
) => IPrism<Resource, Input, Output, Config, LoadOpts> {
  const prism = (
    customConfig?: PartialPrismConfig<Config, Input>,
    customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>, 'logger'>,
  ) => {
    const components: PickRequired<
      Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>,
      'logger'
    > = Object.assign({}, defaultComponents, customComponents);

    // our loaded resources (HttpOperation objects, etc)
    let resources: Resource[] = [];

    return {
      get resources(): Resource[] {
        return resources;
      },

      load: async (opts?: LoadOpts): Promise<void> => {
        const { loader } = components;
        if (opts && loader) {
          resources = await loader.load(opts, defaultComponents.loader);
        }
      },

      process: (input: Input, c?: Config) => {
        // build the config for this request
        const configMerger = configMergerFactory(defaultConfig, customConfig, c);
        const configObj: Config | undefined = configMerger(input);
        const inputValidations: IPrismDiagnostic[] = [];

        return components.router
          ? components.router
              .route({ resources, input, config: configObj }, defaultComponents.router)
              .mapLeft(error => {
                const { message, name, status } = error as ProblemJsonError;
                // otherwise let's just stack it on the inputValidations
                // when someone simply wants to hit an URL, don't block them
                inputValidations.push({
                  message,
                  source: name,
                  code: status,
                  severity: DiagnosticSeverity.Warning,
                });

                return error;
              })
              .chain(resource => {
                // validate input
                if (components.validator && components.validator.validateInput) {
                  inputValidations.push(
                    ...components.validator.validateInput(
                      {
                        resource,
                        input,
                        config: configObj,
                      },
                      defaultComponents.validator,
                    ),
                  );
                }

                if (components.mocker && (configObj as IPrismConfig).mock) {
                  // generate the response
                  return components.mocker
                    .mock(
                      {
                        resource,
                        input: { validations: { input: inputValidations }, data: input },
                        config: configObj,
                      },
                      defaultComponents.mocker,
                    )
                    .run(components.logger.child({ name: 'NEGOTIATOR' }))
                    .map(output => ({ resource, output }));
                }

                return right<Error, { output: Output | undefined; resource: Resource }>({
                  output: undefined,
                  resource,
                });
              })
              .map(({ resource, output }) => {
                // validate output
                const outputValidations: IPrismDiagnostic[] = [];
                if (components.validator && components.validator.validateOutput) {
                  outputValidations.push(
                    ...components.validator.validateOutput(
                      {
                        resource,
                        output,
                        config: configObj,
                      },
                      defaultComponents.validator,
                    ),
                  );
                }

                return {
                  input,
                  output,
                  validations: {
                    input: inputValidations,
                    output: outputValidations,
                  },
                };
              })
          : right<Error, IPrismOutput<Input, Output>>({
              input,
              output: undefined,
              validations: { input: [], output: [] },
            });
      },
    };
  };
  return prism;
}
