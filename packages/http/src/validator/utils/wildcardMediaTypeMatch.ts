import { parse, ContentType } from 'content-type';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export function wildcardMediaTypeMatch(mediaTypeA: string, mediaTypeB: string) {
  return pipe(
    O.Do,
    O.bind('a', () => parseContentType(mediaTypeA)),
    O.bind('b', () => parseContentType(mediaTypeB)),
    O.fold(
      () => false,
      ({ a, b }) => {
        return (a.type === b.type || b.type === '*') && (a.subtype === b.subtype || b.subtype === '*');
      }
    )
  );
}

// This regexp doesn't need to be accurate with RFC spec
// since we need it only to extract suffix nad subtype part of content-type
const CONTENT_TYPE_REGEXP = /^(.+)\/(?:(.+)\+)?(.+)$/;

function parseContentType(contentType: string): O.Option<ParsedContentType> {
  return pipe(
    O.tryCatch<ContentType>(() => parse(contentType)),
    O.chain(({ type }) => {
      const match = CONTENT_TYPE_REGEXP.exec(type.toLowerCase());

      if (!match) {
        return O.none;
      }

      const hasExtension = match.length === 4;
      return O.some({
        type: match[1],
        subtype: match[hasExtension ? 3 : 2],
        suffix: hasExtension ? match[2] : undefined,
      });
    })
  );
}

interface ParsedContentType {
  type: string;
  subtype: string;
  suffix?: string;
}
