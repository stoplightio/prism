import { DiagnosticSeverity } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, PickRequired, ProblemJsonError } from './types';
import { validateSecurity } from './utils/security';

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config>>, 'logger'>,
): IPrism<Resource, Input, Output, Config> {
  return {
    process: async (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults(c, defaultConfig) as Config; // Cast required because lodash types are wrong — https://github.com/DefinitelyTyped/DefinitelyTyped/pull/38156
      const inputValidations: IPrismDiagnostic[] = [];

      if (components.router) {
        return pipe(
          components.router.route({ resources, input, config }),
          Either.fold(
            error => {
              // rethrow error we if we're attempting to mock
              if (config.mock) {
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
                ...components.validator.validateInput({
                  resource,
                  input,
                  config,
                }),
              );
            }

            const inputValidationResult = inputValidations.concat(
              pipe(
                validateSecurity(input, resource),
                map(sec => [sec]),
                getOrElse<IPrismDiagnostic[]>(() => []),
              ),
            );

            if (resource && components.mocker && config.mock) {
              // generate the response
              return pipe(
                TaskEither.fromEither(
                  components.mocker.mock({
                    resource,
                    input: {
                      validations: {
                        input: inputValidationResult,
                      },
                      data: input,
                    },
                    config,
                  })(components.logger.child({ name: 'NEGOTIATOR' })),
                ),
                TaskEither.map(output => ({ output, resource })),
              );
            } else if (components.forwarder) {
              // forward request and set output from response
              return pipe(
                components.forwarder.fforward({
                  resource,
                  input: {
                    validations: {
                      input: inputValidationResult,
                    },
                    data: input,
                  },
                  config,
                }),
                TaskEither.map(output => ({ output, resource })),
              );
            }

            return TaskEither.left(new Error('Nor forwarder nor mocker has been selected. Something is wrong'));
          }),
          TaskEither.map(({ output, resource }) => {
            let outputValidations: IPrismDiagnostic[] = [];
            if (resource && components.validator && components.validator.validateOutput) {
              outputValidations = components.validator.validateOutput({
                resource,
                output,
                config,
              });
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
}
