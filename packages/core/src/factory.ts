import * as E from 'fp-ts/Either';
import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import { compact } from 'lodash';
import { pipe } from 'fp-ts/function';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic, IPrismProxyConfig, IPrismOutput } from './types';
import { getSemigroup, NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { DiagnosticSeverity } from '@stoplight/types';
import { identity } from 'fp-ts/function';

const eitherSequence = A.sequence(E.getApplicativeValidation(getSemigroup<IPrismDiagnostic>()));

function isProxyConfig(p: IPrismConfig): p is IPrismProxyConfig {
  return p.isProxy;
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
  ): E.Either<Error, ResourceAndValidation> => {
    const validations = compact([
      config.checkSecurity ? components.validateSecurity({ resource, element: input }) : undefined,
      config.validateRequest ? components.validateInput({ resource, element: input }) : undefined,
    ]);

    return pipe(
      eitherSequence(validations),
      E.fold<NonEmptyArray<IPrismDiagnostic>, unknown, IPrismDiagnostic[]>(identity, () => []),
      validations => E.right({ resource, validations })
    );
  };

  const mockOrForward = (
    resource: Resource,
    data: Input,
    config: Config,
    validations: IPrismDiagnostic[]
  ): TE.TaskEither<Error, ResourceAndValidation & { output: Output }> => {
    const mockCall = () =>
      components.mock({
        resource,
        input: { data, validations },
        config: config.mock || {},
      })(components.logger.child({ name: 'NEGOTIATOR' }));

    const forwardCall = (config: IPrismProxyConfig) =>
      components.forward(
        {
          validations: config.errors ? validations : [],
          data,
        },
        config.upstream.href,
        config.upstreamProxy,
        resource
      );

    const produceOutput = isProxyConfig(config)
      ? pipe(
          forwardCall(config)(components.logger.child({ name: 'PROXY' })),
          TE.orElse(error => {
            if (error.name === 'UPSTREAM_NOT_IMPLEMENTED') {
              components.logger.info('Remocking the call');
              return TE.fromIOEither(mockCall);
            }
            return TE.left(error);
          })
        )
      : TE.fromIOEither(mockCall);

    return pipe(
      produceOutput,
      TE.map(output => ({ output, resource, validations }))
    );
  };

  return {
    request: (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config: Config = defaults(c, defaultConfig);

      return pipe(
        components.route({ resources, input }),
        E.fold(
          error => {
            if (!config.errors && isProxyConfig(config)) {
              return pipe(
                components.forward(
                  { data: input, validations: [] },
                  config.upstream.href,
                  config.upstreamProxy
                )(components.logger.child({ name: 'PROXY' })),
                TE.map(createWarningOutput)
              );
            } else return TE.left(error);
          },
          resource =>
            pipe(
              TE.fromEither(inputValidation(resource, input, config)),
              TE.chain(({ resource, validations }) => mockOrForward(resource, input, config, validations)),
              TE.map(({ output, resource, validations: inputValidations }) => {
                const outputValidations = config.validateResponse
                  ? pipe(
                      E.swap(components.validateOutput({ resource, element: output })),
                      E.getOrElse<Output, IPrismDiagnostic[]>(() => [])
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
