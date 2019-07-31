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
];
