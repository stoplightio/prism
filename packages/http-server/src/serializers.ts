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
    serializer: (data: unknown) => (typeof data === 'string' ? data : xmlSerializer.parse({ xml: data })),
  },
  {
    regex: /text\/plain/,
    serializer: (data: unknown) => {
      if (typeof data === 'string') {
        return data;
      }

      throw Object.assign(new Error('Cannot serialise complex objects as text/plain'), {
        detail: 'Cannot serialise complex objects as text/plain',
        status: 500,
        name: 'https://stoplight.io/prism/errors#NO_COMPLEX_OBJECT_TEXT_PLAIN',
      });
    },
  },
];
