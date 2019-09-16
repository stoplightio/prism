import { IHttpOperationResponse } from '@stoplight/types';
import { head } from 'fp-ts/lib/Array';
import { flatten, fold, none, Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { tail } from 'lodash';
import { Logger } from 'pino';
import { createResponseFromDefault, findResponseByStatusCode } from './InternalHelpers';

const msg = (code: number) => `Unable to find a ${code} response definition`;
const defaultMsg = (code: number) => `Created a ${code} from a default response`;

export const matchingOrder = [401, 403, 422, 400];

export default function matchResponse(
  httpResponses: IHttpOperationResponse[],
  logger: Logger,
  order: number[] = matchingOrder,
): Option<IHttpOperationResponse> {
  return pipe(
    head(order),
    fold(
      () => flatten(tryToFindDefaultResponse(httpResponses, logger)),
      possibleMatch => {
        return pipe(
          findResponseByStatusCode(httpResponses, `${possibleMatch}`),
          fold(
            () => {
              logger.trace(msg(possibleMatch));

              return matchResponse(httpResponses, logger, tail(order));
            },
            matchedResponse => some(matchedResponse),
          ),
        );
      },
    ),
  );
}

function tryToFindDefaultResponse(httpResponses: IHttpOperationResponse[], logger: Logger) {
  const possiblyDefaultResponse = createResponseFromDefault(httpResponses, '422');

  if (possiblyDefaultResponse) {
    logger.trace(defaultMsg(422));

    return some(possiblyDefaultResponse);
  } else {
    logger.trace('Unable to find a default response definition.');

    return none;
  }
}
