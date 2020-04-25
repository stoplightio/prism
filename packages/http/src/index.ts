import { factory, IPrismDiagnostic, isProxyConfig } from '@stoplight/prism-core';
import { IHttpOperation, DiagnosticSeverity } from '@stoplight/types';
import { defaults } from 'lodash';
import forward from './forwarder';
import mock from './mocker';
import route from './router';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as E from 'fp-ts/lib/Either';
import { validateInput, validateOutput, validateSecurity } from './validator';
export * from './types';
export * from './getHttpOperations';
export * from './mocker/errors';
export * from './router/errors';
export * from './mocker/serializer/style';
export { generate as generateHttpParam } from './mocker/generator/HttpParamGenerator';
import {
  IHttpConfig,
  IHttpResponse,
  IHttpRequest,
  PickRequired,
  PrismHttpComponents,
  IHttpProxyConfig,
  ProblemJsonError,
} from './types';
import { UNAUTHORIZED, UNPROCESSABLE_ENTITY } from './mocker/errors';

export const createInstance = (
  defaultConfig: IHttpConfig | IHttpProxyConfig,
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>
) =>
  factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, {
      route,
      validateInput,
      validateOutput,
      validateSecurity,
      mock,
      forward,
      inputValidationGate: (
        validations: NonEmptyArray<IPrismDiagnostic>,
        resource: IHttpOperation
      ): E.Either<Error, IHttpOperation> => {
        if (isProxyConfig(defaultConfig)) {
          const securityValidation = validations.find(validation => validation.code === 401);

          const error = securityValidation
            ? ProblemJsonError.fromTemplate(
                UNAUTHORIZED,
                'Your request does not fullfil the security requirements and no HTTP unauthorized response was found in the spec, so Prism is generating this error for you.',
                securityValidation.tags && securityValidation.tags.length
                  ? {
                      headers: { 'WWW-Authenticate': securityValidation.tags.join(',') },
                    }
                  : undefined
              )
            : ProblemJsonError.fromTemplate(
                UNPROCESSABLE_ENTITY,
                'Your request is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
                {
                  validation: validations.map(detail => ({
                    location: detail.path,
                    severity: DiagnosticSeverity[detail.severity],
                    code: detail.code,
                    message: detail.message,
                  })),
                }
              );

          return E.left(error);
        }

        return E.right(resource);
      },
    })
  );
