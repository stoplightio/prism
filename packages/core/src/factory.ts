import { DiagnosticSeverity } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { configMergerFactory, PartialPrismConfig, PrismConfig } from '.';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, PickRequired, ProblemJsonError } from './types';

export function factory<Resource, Input, Output, Config>(
  defaultConfig: PrismConfig<Config, Input>,
  defaultComponents: Partial<IPrismComponents<Resource, Input, Output, Config>>,
): (
  customConfig?: PartialPrismConfig<Config, Input>,
  customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config>>, 'logger'>,
) => IPrism<Resource, Input, Output, Config> {
  const prism = (
    customConfig?: PartialPrismConfig<Config, Input>,
    customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config>>, 'logger'>,
  ) => {
    const components: PickRequired<
      Partial<IPrismComponents<Resource, Input, Output, Config>>,
      'logger'
    > = Object.assign({}, defaultComponents, customComponents);
    return {
      process: async (input: Input, resources: Resource[], c?: Config) => {
        // build the config for this request
        const configMerger = configMergerFactory(defaultConfig, customConfig, c);
        const configObj: Config | undefined = configMerger(input);
        const inputValidations: IPrismDiagnostic[] = [];

        if (components.router) {
          return pipe(
            components.router.route({ resources, input, config: configObj }, defaultComponents.router),
            Either.fold(
              error => {
                // rethrow error we if we're attempting to mock
                if ((configObj as IPrismConfig).mock) {
                  return TaskEither.left(error);
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

                return TaskEither.right<Error, Resource | undefined>(undefined);
              },
              value => TaskEither.right(value),
            ),
            TaskEither.chain(resource => {
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
                return pipe(
                  TaskEither.fromEither(
                    components.mocker.mock(
                      {
                        resource,
                        input: { validations: { input: inputValidations }, data: input },
                        config: configObj,
                      },
                      defaultComponents.mocker,
                    )(components.logger.child({ name: 'NEGOTIATOR' })),
                  ),
                  TaskEither.map(output => ({ output, resource })),
                );
              } else if (components.forwarder) {
                // forward request and set output from response
                return pipe(
                  components.forwarder.fforward(
                    {
                      resource,
                      input: { validations: { input: inputValidations }, data: input },
                      config: configObj,
                    },
                    defaultComponents.forwarder,
                  ),
                  TaskEither.map(output => ({ output, resource })),
                );
              }

              return TaskEither.left(new Error('Nor forwarder nor mocker has been selected. Something is wrong'));
            }),
            TaskEither.map(({ output, resource }) => {
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
            }),
          )().then(v =>
            pipe(
              v,
              Either.fold(
                e => {
                  throw e;
                },
                o => o,
              ),
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
