import { IHttpOperationResponse } from '@stoplight/types';
import { none, Option, some } from 'fp-ts/lib/Option';
import { head, tail } from 'lodash';
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
  const possibleMatch = order.length && head(order);

  if (!!possibleMatch) {
    const matchedResponse = findResponseByStatusCode(httpResponses, `${possibleMatch}`);

    if (!!matchedResponse) {
      return some(matchedResponse);
    } else {
      logger.trace(msg(possibleMatch));

      return matchResponse(httpResponses, logger, tail(order));
    }
  } else {
    return tryToFindDefaultResponse(httpResponses, logger);
  }
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
