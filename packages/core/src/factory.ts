import { DiagnosticSeverity } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, ProblemJsonError } from './types';
import { validateSecurity } from './utils/security';

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: IPrismComponents<Resource, Input, Output, Config>,
): IPrism<Resource, Input, Output, Config> {
  return {
    request: async (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults(c, defaultConfig) as Config; // Cast required because lodash types are wrong — https://github.com/DefinitelyTyped/DefinitelyTyped/pull/38156
      const inputValidations: IPrismDiagnostic[] = [];

      return pipe(
        components.route({ resources, input, config }),
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
          if (config.validateRequest && resource && components.validateInput) {
            inputValidations.push(
              ...components.validateInput({
                resource,
                element: input,
              }),
            );
          }

          const inputValidationResult = config.checkSecurity
            ? inputValidations.concat(
                pipe(
                  validateSecurity(input, resource),
                  map(sec => [sec]),
                  getOrElse<IPrismDiagnostic[]>(() => []),
                ),
              )
            : inputValidations;

          if (resource && config.mock) {
            // generate the response
            return pipe(
              TaskEither.fromEither(
                components.mock({
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
          }

          return TaskEither.left(new Error('Resource not defined. This should never happen.'));
        }),
        TaskEither.map(({ output, resource }) => {
          let outputValidations: IPrismDiagnostic[] = [];
          if (config.validateResponse && resource && components.validateOutput) {
            outputValidations = components.validateOutput({
              resource,
              element: output,
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
    },
  };
}
