import * as Either from 'fp-ts/lib/Either';
import { getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic } from './types';
import { validateSecurity } from './utils/security';

function toVal(x: any) {
  return pipe(
    x,
    Either.fold(e => e, r => r),
  );
}

export function factory<Resource, Input, Output, Config extends IPrismConfig>(
  defaultConfig: Config,
  components: IPrismComponents<Resource, Input, Output, Config>,
): IPrism<Resource, Input, Output, Config> {
  return {
    request: async (input: Input, resources: Resource[], c?: Config) => {
      // build the config for this request
      const config = defaults<unknown, Config>(c, defaultConfig);

      // @ts-ignore
      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        // @ts-ignore
        TaskEither.chain(r => {
          const { request } = r as any;

          return pipe(
            components.deserializeInput(input, request),
            Either.map((e: any) => {
              return {
                resource: r as any,
                rest: e as any,
              };
            }),
            TaskEither.fromEither,
          );
        }),
        TaskEither.chain(({ resource, rest }: any) => {
          // input validations are now created here and passed down the chain
          const inputValidations_: IPrismDiagnostic[] =
            config.validateRequest && resource
              ? (toVal(
                  components.validateInput({
                    resource,
                    element: input,
                    // @ts-ignore
                    schema: rest.schema,
                    body: rest.body,
                  }),
                ) as IPrismDiagnostic[])
              : [];

          const inputValidationResult = config.checkSecurity
            ? inputValidations_.concat(
                pipe(
                  validateSecurity(input, resource),
                  map(sec => [sec]),
                  getOrElse<IPrismDiagnostic[]>(() => []),
                ),
              )
            : inputValidations_;

          const outputLocator = config.mock
            ? TaskEither.fromEither(
                components.mock({
                  resource,
                  input: {
                    validations: inputValidationResult,
                    data: input,
                  },
                  config: config.mock,
                })(components.logger.child({ name: 'NEGOTIATOR' })),
              )
            : components.forward(resource, input);

          return pipe(
            outputLocator,
            TaskEither.map(output => ({ output, resource, inputValidations: inputValidations_ })),
          );
        }),
        TaskEither.map(({ output, resource, inputValidations }) => {
          const outputValidations: IPrismDiagnostic[] =
            config.validateResponse && resource
              ? components.validateOutput({
                  resource,
                  element: output,
                })
              : [];

          return {
            input,
            output,
            validations: {
              input: inputValidations,
              output: toVal(outputValidations),
            },
          };
        }),
      )().then((v: any) =>
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
