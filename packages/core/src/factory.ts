import * as Either from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, IPrismProxyConfig, IPrismOutput } from './types';
import { sequenceT } from 'fp-ts/lib/Apply';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { DiagnosticSeverity } from '@stoplight/types';

const sequenceValidation = sequenceT(Either.getValidation(getSemigroup<IPrismDiagnostic>()));

function isProxyConfig(p: IPrismConfig): p is IPrismProxyConfig {
  return !p.mock;
}

function createWarningOutput<Output>(output: Output): IPrismOutput<Output> {
  return {
    output,
    validations: {
      input: [
        {
          message: 'Selected route not found',
          severity: DiagnosticSeverity.Warning,
        },
      ],
      output: [],
    },
  };
}

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: IPrismComponents<Resource, Input, Output, Config>
): IPrism<Resource, Input, Output, Config> {
  type ResourceAndValidation = {
    resource: Resource;
    validations: IPrismDiagnostic[];
  };

  const inputValidation = (
    resource: Resource,
    input: Input,
    config: Config
  ): TaskEither.TaskEither<Error, ResourceAndValidation> =>
    pipe(
      sequenceValidation(
        config.validateRequest ? components.validateInput({ resource, element: input }) : Either.right(input),
        config.checkSecurity ? components.validateSecurity({ resource, element: input }) : Either.right(input)
      ),
      Either.fold(
        validations => validations as IPrismDiagnostic[],
        () => []
      ),
      validations => TaskEither.right({ resource, validations })
    );

  const mockOrForward = (
    resource: Resource,
    input: Input,
    config: Config,
    validations: IPrismDiagnostic[]
  ): TaskEither.TaskEither<Error, ResourceAndValidation & { output: Output }> => {
    const produceOutput = isProxyConfig(config)
      ? components.forward(input, config.upstream.href)(components.logger.child({ name: 'PROXY' }))
      : TaskEither.fromEither(
          components.mock({
            resource,
            input: {
              validations,
              data: input,
            },
            config: config.mock,
          })(components.logger.child({ name: 'NEGOTIATOR' }))
        );

    return pipe(
      produceOutput,
      TaskEither.map(output => ({ output, resource, validations }))
    );
  };

  return {
    request: (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults<unknown, Config>(c, defaultConfig);

      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        TaskEither.fold(
          error => {
            if (!config.errors && isProxyConfig(config)) {
              return pipe(
                components.forward(input, config.upstream.href)(components.logger.child({ name: 'PROXY' })),
                TaskEither.map(createWarningOutput)
              );
            } else return TaskEither.left(error);
          },
          resource =>
            pipe(
              inputValidation(resource, input, config),
              TaskEither.chain(({ resource, validations }) => mockOrForward(resource, input, config, validations)),
              TaskEither.map(({ output, resource, validations: inputValidations }) => {
                const outputValidations = config.validateResponse
                  ? pipe(
                      Either.swap(components.validateOutput({ resource, element: output })),
                      Either.getOrElse<Output, IPrismDiagnostic[]>(() => [])
                    )
                  : [];

                return {
                  output,
                  validations: {
                    input: inputValidations,
                    output: outputValidations,
                  },
                };
              })
            )
        )
      );
    },
  };
}
