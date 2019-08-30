import { j2xParser } from 'fast-xml-parser';
import typeIs = require('type-is');

const xmlSerializer = new j2xParser({});

export default [
  {
    test: (value: string) => !!typeIs.is(value, ['application/json', 'application/*+json']),
    serializer: (data: any) => {
      try {
        JSON.parse(data);
      } catch (e) {
        return JSON.stringify(data);
      }

      // might be more edge cases, not just number ?
      return typeof data === 'number' ? JSON.stringify(data) : data;
    },
  },
  {
    test: (value: string) => {
      return !!typeIs.is(value, ['application/xml', 'application/*+xml']);
    },
    serializer: (data: unknown) => (typeof data === 'string' ? data : xmlSerializer.parse(data)),
  },
  {
    test: (value: string) => !!value.match(/text\/plain/),
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
