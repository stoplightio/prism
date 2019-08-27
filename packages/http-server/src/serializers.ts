import { ProblemJsonError } from '@stoplight/prism-http';
import { NOT_ACCEPTABLE } from '@stoplight/prism-http';
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
      if (typeof data === 'string') return data;
      throw ProblemJsonError.fromTemplate(NOT_ACCEPTABLE, 'Cannot serialise complex objects as text/plain');
    },
  },
];
