import { ProblemJsonError } from '@stoplight/prism-http';
import { j2xParser } from 'fast-xml-parser';
import typeIs = require('type-is');

const xmlSerializer = new j2xParser({});

export default [
  {
    regex: {
      test: (value: string) => !!typeIs.is(value, ['application/*+json']),
      toString: () => 'application/*+json',
    },
    serializer: JSON.stringify,
  },
  {
    regex: {
      test: (value: string) => !!typeIs.is(value, ['application/xml', 'application/*+xml']),
      toString: () => 'application/*+xml',
    },
    serializer: (data: unknown) => (typeof data === 'string' ? data : xmlSerializer.parse(data)),
  },
  {
    regex: /text\/plain/,
    serializer: (data: unknown) => {
      if (typeof data === 'string') {
        return data;
      }
      throw ProblemJsonError.fromPlainError(
        Object.assign(new Error('Internal Server Error'), {
          detail: 'Cannot serialise complex objects as text/plain',
          status: 500,
          name: 'https://stoplight.io/prism/errors#NO_COMPLEX_OBJECT_TEXT_PLAIN',
        }),
      );
    },
  },
];
