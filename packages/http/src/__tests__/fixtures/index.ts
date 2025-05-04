import { IPrismInput } from '@stoplight/prism-core';
import { DiagnosticSeverity, HttpParamStyles, IHttpOperation } from '@stoplight/types';
import { faker } from '@faker-js/faker';
import { IHttpRequest, IHttpResponse } from '../../types';

export const httpOperations: IHttpOperation[] = [
  {
    id: 'todos',
    method: 'get',
    path: '/todos',
    request: {
      query: [
        {
          id: faker.lorem.word(),
          required: false,
          name: 'name',
          style: HttpParamStyles.Form,
        },
        {
          id: faker.lorem.word(),
          required: true,
          name: 'completed',
          style: HttpParamStyles.Form,
        },
      ],
    },
    responses: [
      {
        id: faker.lorem.word(),
        code: '200',
        contents: [
          {
            id: faker.lorem.word(),
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
                id: faker.lorem.word(),
                key: 'application/json',
                value: {
                  id: 1,
                  completed: true,
                  name: 'make prism',
                },
              },
              {
                id: faker.lorem.word(),
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
            id: faker.lorem.word(),
            mediaType: 'application/xml',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'first',
                value: '{ "root": "first" }',
              },
              {
                id: faker.lorem.word(),
                key: 'second',
                value: '{ "root": "second" }',
              },
            ],
            encodings: [],
          },
          {
            id: faker.lorem.word(),
            mediaType: 'text/plain',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'text',
                value: 'some text',
              },
              {
                id: faker.lorem.word(),
                key: 'plain',
                value: 'some plain',
              },
            ],
            encodings: [],
          },
        ],
      },
      {
        id: faker.lorem.word(),
        code: '201',
        contents: [
          {
            id: faker.lorem.word(),
            mediaType: 'application/json',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'first',
                value: '{ "root": "first" }',
              },
              {
                id: faker.lorem.word(),
                key: 'second',
                value: '{ "root": "second" }',
              },
            ],
          },
          {
            id: faker.lorem.word(),
            mediaType: 'application/xml',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'first',
                value: '<root>first</root>',
              },
              {
                id: faker.lorem.word(),
                key: 'second',
                value: '<root>second</root>',
              },
            ],
          },
        ],
      },
      {
        id: faker.lorem.word(),
        code: '422',
        contents: [
          {
            id: faker.lorem.word(),
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
                id: faker.lorem.word(),
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
        id: faker.lorem.word(),
        code: '200',
        headers: [
          {
            id: faker.lorem.word(),
            name: 'x-todos-publish',
            style: HttpParamStyles.Simple,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        contents: [
          {
            id: faker.lorem.word(),
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
            id: faker.lorem.word(),
            mediaType: 'application/xml',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'xml',
                value: '<todo><name>Shopping</name><completed>false</completed></todo>',
              },
            ],
            encodings: [],
          },
        ],
      },
      {
        id: faker.lorem.word(),
        code: '422',
        headers: [],
        contents: [
          {
            id: faker.lorem.word(),
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
        id: faker.lorem.word(),
        contents: [
          {
            id: faker.lorem.word(),
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
          id: faker.lorem.word(),
          name: 'overwrite',
          style: HttpParamStyles.Form,
          schema: { type: 'string', pattern: '^(yes|no)$' },
        },
      ],
      headers: [
        {
          id: faker.lorem.word(),
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
        id: faker.lorem.word(),
        code: '200',
      },
    ],
  },
  {
    id: 'updateTodo',
    deprecated: true,
    method: 'patch',
    path: '/todo/{todoId}',
    request: {},
    responses: [
      {
        id: faker.lorem.word(),
        code: '200',
        headers: [],
        contents: [
          {
            id: faker.lorem.word(),
            mediaType: 'application/json',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'application/json',
                value: 'OK',
              },
            ],
          },
        ],
      },
      {
        id: faker.lorem.word(),
        code: '400',
        headers: [],
        contents: [
          {
            id: faker.lorem.word(),
            mediaType: 'application/json',
            examples: [
              {
                id: faker.lorem.word(),
                key: 'application/json',
                value: {
                  message: 'error',
                },
              },
            ],
            encodings: [],
          },
        ],
      },
    ],
  },
];

export const httpOperationsByRef = {
  deprecated: httpOperations[3],
};

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
  {
    method: 'patch',
    url: {
      path: '/todo/10',
    },
  },
];

export const httpInputsByRef = {
  updateTodo: httpInputs[3],
};

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
  {
    validations: [],
    data: httpInputsByRef.updateTodo,
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
