import { IPrismInput } from '@stoplight/prism-core';
import { DiagnosticSeverity, HttpParamStyles, IHttpOperation } from '@stoplight/types';

import { IHttpRequest, IHttpResponse } from '../../types';

export const httpOperations: IHttpOperation[] = [
  {
    id: 'todos',
    method: 'get',
    path: '/todos',
    request: {
      query: [
        {
          required: false,
          name: 'name',
          style: HttpParamStyles.Form,
        },
        {
          required: true,
          name: 'completed',
          style: HttpParamStyles.Form,
        },
      ],
    },
    responses: [
      {
        code: '200',
        contents: [
          {
            mediaType: 'application/json',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  completed: {
                    type: 'boolean',
                  },
                },
                required: ['name', 'completed'],
              },
            },
            examples: [
              {
                key: 'application/json',
                value: {
                  id: 1,
                  completed: true,
                  name: 'make prism',
                },
              },
              {
                key: 'bear',
                value: [
                  {
                    id: 2,
                    completed: false,
                    name: 'make bears',
                  },
                ],
              },
            ],
            encodings: [],
          },
          {
            mediaType: 'application/xml',
            examples: [
              {
                key: 'first',
                value: '{ "root": "first" }',
              },
              {
                key: 'second',
                value: '{ "root": "second" }',
              },
            ],
            encodings: [],
          },
          {
            mediaType: 'text/plain',
            examples: [
              {
                key: 'text',
                value: 'some text',
              },
              {
                key: 'plain',
                value: 'some plain',
              },
            ],
            encodings: [],
          },
        ],
      },
      {
        code: '201',
        contents: [
          {
            mediaType: 'application/json',
            examples: [
              {
                key: 'first',
                value: '{ "root": "first" }',
              },
              {
                key: 'second',
                value: '{ "root": "second" }',
              },
            ],
          },
          {
            mediaType: 'application/xml',
            examples: [
              {
                key: 'first',
                value: '<root>first</root>',
              },
              {
                key: 'second',
                value: '<root>second</root>',
              },
            ],
          },
        ],
      },
      {
        code: '422',
        contents: [
          {
            mediaType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
              required: ['message'],
            },
            examples: [
              {
                key: 'application/json',
                value: {
                  message: 'error',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'todo',
    method: 'get',
    path: '/todos/{todoId}',
    request: {},
    responses: [
      {
        code: '200',
        headers: [
          {
            name: 'x-todos-publish',
            style: HttpParamStyles.Simple,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        contents: [
          {
            mediaType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                completed: {
                  type: 'boolean',
                },
              },
              required: ['name', 'completed'],
            },
            examples: [],
            encodings: [],
          },
          {
            mediaType: 'application/xml',
            examples: [
              {
                key: 'xml',
                value: '<todo><name>Shopping</name><completed>false</completed></todo>',
              },
            ],
            encodings: [],
          },
        ],
      },
      {
        code: '422',
        headers: [],
        contents: [
          {
            mediaType: 'application/json',
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
              required: ['message'],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'todos',
    method: 'post',
    path: '/todos',
    request: {
      body: {
        contents: [
          {
            mediaType: 'application/json',
            schema: {
              type: 'object',
              properties: { name: { type: 'string' }, completed: { type: 'boolean' } },
              required: ['name', 'completed'],
            },
          },
        ],
      },
      query: [
        {
          name: 'overwrite',
          style: HttpParamStyles.Form,
          schema: { type: 'string', pattern: '^(yes|no)$' },
        },
      ],
      headers: [
        {
          name: 'x-todos-publish',
          style: HttpParamStyles.Simple,
          schema: { type: 'string', format: 'date-time' },
          examples: [],
          encodings: [],
        },
      ],
      cookie: [],
      path: [],
    },
    responses: [
      {
        code: '200',
      },
    ],
  },
];

export const httpInputs: IHttpRequest[] = [
  {
    method: 'get' as const,
    url: { path: '/todos', baseUrl: '' },
  },
  {
    method: 'get' as const,
    url: { path: '/todos/5', baseUrl: '' },
  },
  {
    method: 'post',
    url: {
      path: '/',
      query: {
        overwrite: 'yes',
      },
    },
    body: '{"name":"Shopping","completed":true}',
    headers: {
      'x-todos-publish': '2018-11-01T10:50:00.05Z',
    },
  },
];

export const httpRequests: Array<IPrismInput<IHttpRequest>> = [
  {
    validations: [],
    data: httpInputs[0],
  },
  {
    validations: [
      {
        path: ['/'],
        code: 'x',
        severity: DiagnosticSeverity.Error,
        message: 'message',
      },
    ],
    data: httpInputs[1],
  },
];

export const httpOutputs: IHttpResponse[] = [
  {
    statusCode: 200,
  },
  {
    statusCode: 200,
    headers: {
      'x-todos-publish': '2018-11-01T11:42:00.05Z',
    },
    body: '{"name":"Shopping","completed":false}',
  },
];
