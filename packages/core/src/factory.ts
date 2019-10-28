import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, IPrismProxyConfig } from './types';
import { validateSecurity } from './utils/security';
import { sequenceT } from 'fp-ts/lib/Apply';
import { NonEmptyArray, getSemigroup } from 'fp-ts/lib/NonEmptyArray';

const sequenceValidation = sequenceT(Either.getValidation(getSemigroup<IPrismDiagnostic>()));

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

      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        TaskEither.chain(resource =>
          TaskEither.fromEither(
            pipe(
              sequenceValidation(
                config.validateRequest ? components.validateInput({ resource, element: input }) : Either.right(input),
                config.checkSecurity ? validateSecurity(input, resource) : Either.right(input)
              ),
              Either.map(() => ({ resource, inputValidations: [] })),
              Either.orElse<
                NonEmptyArray<IPrismDiagnostic>,
                { resource: Resource; inputValidations: IPrismDiagnostic[] },
                Error
              >(inputValidations => Either.right({ resource, inputValidations }))
            )
          )
        ),
        TaskEither.chain(({ resource, inputValidations }) => {
          const produceOutput = isProxyConfig(config)
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
            produceOutput,
            TaskEither.map(output => ({ output, resource, inputValidations }))
          );
        }),
        TaskEither.map(({ output, resource, inputValidations }) => {
          const outputValidations = pipe(
            config.validateResponse,
            Option.fromPredicate(t => t),
            Option.chain(() =>
              Option.fromEither(Either.swap(components.validateOutput({ resource, element: output })))
            ),
            Option.map<NonEmptyArray<IPrismDiagnostic>, IPrismDiagnostic[]>(t => t),
            Option.getOrElse<IPrismDiagnostic[]>(() => [])
          );

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
