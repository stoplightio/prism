import * as Either from 'fp-ts/lib/Either';
import { getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, IPrismProxyConfig } from './types';
import { validateSecurity } from './utils/security';

function isProxyConfig(p: IPrismConfig): p is IPrismProxyConfig {
  return !p.mock;
}

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: IPrismComponents<Resource, Input, Output, Config>
): IPrism<Resource, Input, Output, Config> {
  return {
    request: (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults<unknown, Config>(c, defaultConfig);
      const inputValidations: IPrismDiagnostic[] = [];

      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        TaskEither.chain(resource => {
          if (config.validateRequest) {
            inputValidations.push(
              ...components.validateInput({
                resource,
                element: input,
              })
            );
          }

          config.checkSecurity
            ? inputValidations.push(
                ...pipe(
                  validateSecurity(input, resource),
                  map(sec => [sec]),
                  getOrElse<IPrismDiagnostic[]>(() => [])
                )
              )
            : inputValidations;

          const outputLocator = isProxyConfig(config)
            ? components.forward(input, config.upstream.href)
            : TaskEither.fromEither(
                components.mock({
                  resource,
                  input: {
                    validations: inputValidations,
                    data: input,
                  },
                  config: config.mock,
                })(components.logger.child({ name: 'NEGOTIATOR' }))
              );

          return pipe(
            outputLocator,
            TaskEither.map(output => ({ output, resource }))
          );
        }),
        TaskEither.map(({ output, resource }) => {
          let outputValidations: IPrismDiagnostic[] = [];
          if (config.validateResponse) {
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
        })
      )().then(v =>
        pipe(
          v,
          Either.fold(
            e => {
              throw e;
            },
            o => o
          )
        )
      );
    },
  };
}
