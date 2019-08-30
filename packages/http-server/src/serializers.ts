import { Dictionary } from '@stoplight/types';
import { j2xParser } from 'fast-xml-parser';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import typeIs = require('type-is');

type Serializer = {
  test: (contentType: string) => boolean;
  serialize: (value: string | object) => string;
};

const xmlSerializer = new j2xParser({});

export const serializers: Serializer[] = [
  {
    test: (value: string) => !!typeIs.is(value, ['application/json', 'application/*+json']),
    serialize: (data: any) => {
      try {
        JSON.parse(data);
      } catch (e) {
        return JSON.stringify(data);
      }

      return typeof data === 'string' ? data : JSON.stringify(data);
    },
  },
  {
    test: (value: string) => {
      return !!typeIs.is(value, ['application/xml', 'application/*+xml']);
    },
    serialize: (data: unknown) => (typeof data === 'string' ? data : xmlSerializer.parse(data)),
  },
  {
    test: (value: string) => !!value.match(/text\/plain/),
    serialize: (data: unknown) => {
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

export const optionallySerializeAndSend = (
  reply: FastifyReply<ServerResponse>,
  output: { headers?: Dictionary<string, string>; body?: string | object },
  respSerializers: Serializer[],
) => {
  const contentType = output.headers && output.headers['Content-type'];
  const serializer = respSerializers.find((s: Serializer) => s.test(contentType || ''));

  const data = serializer && output.body ? serializer.serialize(output.body) : output.body;
  const isInUTF8 = contentType && contentType.includes('charset=utf-8');

  if (serializer) {
    reply.serializer(serializer.serialize);
  }

  if (contentType && contentType.includes('application/json')) {
    reply.header('content-type', isInUTF8 ? contentType : contentType + '; charset=utf-8');
  }

  reply.send(data);
};
