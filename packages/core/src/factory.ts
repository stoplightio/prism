import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic } from './types';
import { validateSecurity } from './utils/security';
import { sequenceT } from 'fp-ts/lib/Apply';
import { NonEmptyArray, getSemigroup } from 'fp-ts/lib/NonEmptyArray';

const sequenceValidation = sequenceT(Either.getValidation(getSemigroup<IPrismDiagnostic>()));

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
        TaskEither.chain(resource => {
          const validateInputAndSecurity = sequenceValidation(
            config.validateRequest ? components.validateInput({ resource, element: input }) : Either.right(input),
            config.checkSecurity ? validateSecurity(input, resource) : Either.right(input)
          );

          const mockWithValidation = (validations: IPrismDiagnostic[]) =>
            components.mock({
              resource,
              input: {
                validations,
                data: input,
              },
              config: config.mock,
            });

          const produceOutput = config.mock
            ? TaskEither.fromEither(
                pipe(
                  validateInputAndSecurity,
                  Either.fold(mockWithValidation, () => mockWithValidation([]))
                )(components.logger.child({ name: 'NEGOTIATOR' }))
              )
            : components.forward(resource, input);

          return pipe(
            produceOutput,
            TaskEither.map(output => ({ output, resource }))
          );
        }),
        TaskEither.map(({ output, resource }) => {
          const outputValidations = pipe(
            config.validateResponse,
            Option.fromPredicate(t => t),
            Option.chain(() =>
              Option.fromEither(
                pipe(
                  components.validateOutput({ resource, element: output }),
                  Either.swap
                )
              )
            ),
            Option.map<NonEmptyArray<IPrismDiagnostic>, IPrismDiagnostic[]>(t => t),
            Option.getOrElse<IPrismDiagnostic[]>(() => [])
          );

          return {
            input,
            output,
            validations: {
              input: [],
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
