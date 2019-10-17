import {findOperationResponse} from "@stoplight/prism-http/src/validator/utils/spec";
import {DiagnosticSeverity} from "@stoplight/types/dist";
import * as Either from 'fp-ts/lib/Either';
import { getOrElse, fold, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, inRange } from 'lodash';
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

      return pipe(
        TaskEither.fromEither(components.route({ resources, input })),
        // @ts-ignore
        TaskEither.chain(r => {
          const { request } = r as any;

          return pipe(
            components.deserializeInput(input, request),
            Either.map((rest) => {
              return {
                resource: r,
                rest,
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
                    ...rest
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
        TaskEither.chain(({ output, resource, inputValidations }) => {
          // const resp = pipe(
          //   findOperationResponse(resource.responses, (output as any).statusCode),
          //   fold(() => {
          //     const v =
          //       {
          //         message: 'Unable to match the returned status code with those defined in spec',
          //         severity: inRange((output as any).statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
          //       };
          //
          //     return Either.left([v]);
          //   },
          // (a) => Either.right(a))
          // );

          return pipe(
            // responses[0] ???
            components.deserializeOutput(output, resource.responses[0]),
            Either.map((e: any) => {
              return {
                output,
                inputValidations,
                resource: resource as any,
                rest: e as any,
                resp: {}
              };
            }),
            TaskEither.fromEither,
          );

          // return pipe(
          //   resp,
          //   Either.chain((resp) => components.deserializeOutput(output, resp)),
          //   Either.map((rest: any) => {
          //     return {
          //       output,
          //       inputValidations,
          //       resource: resource as any,
          //       rest,
          //       resp
          //     };
          //   }),
          //   TaskEither.fromEither,
          // );
        }),
        TaskEither.map(({ output, resource, inputValidations, rest, resp }) => {
          const outputValidations: IPrismDiagnostic[] =
            config.validateResponse && resource
              ? components.validateOutput({
                  resource,
                  element: output,
                  ...rest,
                  resp
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
