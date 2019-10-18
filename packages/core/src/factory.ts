import { DiagnosticSeverity } from "@stoplight/types";
import { IHttpRequest } from "@stoplight/types";
import * as Either from 'fp-ts/lib/Either';
import { getOrElse, fold, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, inRange } from 'lodash';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic } from './types';
import { validateSecurity } from './utils/security';

function toVal(x: any): any {
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
        TaskEither.map(r => {
          const { request } = r as any;

          return pipe(
            components.deserializeInput(input, request),
            (deserializedDataAndSchemas) => {
              return {
                resource: r,
                deserializedDataAndSchemas,
              }
            }
          );
        }),
        // @ts-ignore
        TaskEither.chain(({ resource, deserializedDataAndSchemas }) => {
          // input validations are now created here and passed down the chain
          const inputValidations_: IPrismDiagnostic[] =
            config.validateRequest && resource
              ? (toVal(
              components.validateInput({
                resource,
                element: input,
                ...deserializedDataAndSchemas
              }),
              ))
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
          return pipe(
            components.findOperationResponse((resource as any).responses || [], (output as any).statusCode),
            fold(() => {
                return Either.left([{
                  message: 'Unable to match the returned status code with those defined in spec',
                  severity: inRange((output as any).statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
                }]);
              },
              (a) => Either.right(a)),
            Either.map((response) => {
              return {
                deserializedDataAndSchemas: components.deserializeOutput(output, response),
                resp: response
              };
            }),
            Either.map(({ deserializedDataAndSchemas, resp }) => {
              return {
                output,
                inputValidations,
                resource,
                deserializedDataAndSchemas,
                resp
              };
            }),
            TaskEither.fromEither,
          );
        }),
        TaskEither.map(({ output, resource, inputValidations, deserializedDataAndSchemas, resp }) => {
          const outputValidations: IPrismDiagnostic[] =
            config.validateResponse ? components.validateOutput({
                element: output,
                ...deserializedDataAndSchemas,
                // @ts-ignore
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
