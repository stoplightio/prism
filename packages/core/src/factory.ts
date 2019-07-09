import { DiagnosticSeverity } from '@stoplight/types';
import { toError } from 'fp-ts/lib/Either';
import { fromEither, left2v, right2v, tryCatch } from 'fp-ts/lib/TaskEither';
import { configMergerFactory, PartialPrismConfig, PrismConfig } from '.';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, PickRequired, ProblemJsonError } from './types';

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

      process: async (input: Input, c?: Config) => {
        // build the config for this request
        const configMerger = configMergerFactory(defaultConfig, customConfig, c);
        const configObj: Config | undefined = configMerger(input);
        const inputValidations: IPrismDiagnostic[] = [];

        if (components.router) {
          return components.router
            .route({ resources, input, config: configObj }, defaultComponents.router)
            .fold(
              error => {
                // rethrow error we if we're attempting to mock
                if ((configObj as IPrismConfig).mock) {
                  return left2v(error);
                }

                const { message, name, status } = error as ProblemJsonError;
                // otherwise let's just stack it on the inputValidations
                // when someone simply wants to hit an URL, don't block them
                inputValidations.push({
                  message,
                  source: name,
                  code: status,
                  severity: DiagnosticSeverity.Warning,
                });

                return right2v<Error, Resource | undefined>(undefined);
              },
              value => right2v(value),
            )
            .chain(resource => {
              // validate input
              if (resource && components.validator && components.validator.validateInput) {
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

              if (resource && components.mocker && (configObj as IPrismConfig).mock) {
                // generate the response
                return fromEither(
                  components.mocker
                    .mock(
                      {
                        resource,
                        input: { validations: { input: inputValidations }, data: input },
                        config: configObj,
                      },
                      defaultComponents.mocker,
                    )
                    .run(components.logger.child({ name: 'NEGOTIATOR' })),
                ).map(output => ({ output, resource }));
              } else if (components.forwarder) {
                // forward request and set output from response
                return components.forwarder
                  .fforward(
                    {
                      resource,
                      input: { validations: { input: inputValidations }, data: input },
                      config: configObj,
                    },
                    defaultComponents.forwarder,
                  )
                  .map(output => ({ output, resource }));
              }

              return left2v(new Error('Nor forwarder nor mocker has been selected. Something is wrong'));
            })
            .map(({ output, resource }) => {
              let outputValidations: IPrismDiagnostic[] = [];
              if (resource && components.validator && components.validator.validateOutput) {
                outputValidations = components.validator.validateOutput(
                  {
                    resource,
                    output,
                    config: configObj,
                  },
                  defaultComponents.validator,
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
            .run()
            .then(v =>
              v.fold(
                e => {
                  throw e;
                },
                o => o,
              ),
            );
        }

        return {
          input,
          output: undefined,
          validations: {
            input: [],
            output: [],
          },
        };
      },
    };
  };
  return prism;
}
