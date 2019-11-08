import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, IPrismProxyConfig } from './types';
import { validateSecurity } from './utils/security';
import { sequenceT } from 'fp-ts/lib/Apply';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';

const sequenceValidation = sequenceT(Either.getValidation(getSemigroup<IPrismDiagnostic>()));

function isProxyConfig(p: IPrismConfig): p is IPrismProxyConfig {
  return !p.mock;
}

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: IPrismComponents<Resource, Input, Output, Config>
): IPrism<Resource, Input, Output, Config> {
  type ResourceAndValidation = {
    resource: Resource;
    inputValidations: IPrismDiagnostic[];
  };

  const inputValidation = (
    resource: Resource,
    input: Input,
    config: Config
  ): TaskEither.TaskEither<Error, ResourceAndValidation> =>
    pipe(
      sequenceValidation(
        config.validateRequest ? components.validateInput({ resource, element: input }) : Either.right(input),
        config.checkSecurity ? validateSecurity(input, resource) : Either.right(input)
      ),
      Either.fold(inputValidations => inputValidations as IPrismDiagnostic[], () => []),
      inputValidations => TaskEither.right({ resource, inputValidations })
    );

  const mockOrForward = (
    resource: Resource,
    input: Input,
    config: Config,
    inputValidations: IPrismDiagnostic[]
  ): TaskEither.TaskEither<Error, ResourceAndValidation & { output: Output }> => {
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
  };

  return {
    request: (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults<unknown, Config>(c, defaultConfig);

      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        TaskEither.chain(resource => inputValidation(resource, input, config)),
        TaskEither.chain(({ resource, inputValidations }) => mockOrForward(resource, input, config, inputValidations)),
        TaskEither.map(({ output, resource, inputValidations }) => {
          const outputValidations = config.validateResponse
            ? pipe(
                Option.fromEither(Either.swap(components.validateOutput({ resource, element: output }))),
                Option.getOrElse<IPrismDiagnostic[]>(() => [])
              )
            : [];

          return {
            input,
            output,
            validations: {
              input: inputValidations,
              output: outputValidations,
            },
          };
        })
      );
    },
  };
}
