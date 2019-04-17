import { IHttpOperation } from '@stoplight/types';
import { MemoryLoader } from '../';
import { GraphFacade } from '../../../utils/graphFacade';

describe('httpLoader', () => {
  const fakeHttpOperations: IHttpOperation[] = [
    {
      id: '1',
      method: 'get',
      path: '/test',
      servers: [],
      security: [],
      request: {
        headers: [],
        query: [],
        cookie: [],
        path: [],
      },
      responses: [
        {
          code: '200',
          headers: [],
          contents: [
            {
              mediaType: 'application/json',
              examples: [],
              encodings: [],
            },
          ],
        },
      ],
    },
    {
      id: '2',
      method: 'get',
      path: '/test',
      servers: [],
      security: [],
      request: {
        headers: [],
        query: [],
        cookie: [],
        path: [],
      },
      responses: [
        {
          code: '200',
          headers: [],
          contents: [
            {
              mediaType: 'application/json',
              examples: [],
              encodings: [],
            },
          ],
        },
      ],
    },
  ];

  const graphFacade = new GraphFacade();

  test('should return nothing more what is in the facade', async () => {
    const spy = jest
      .spyOn(graphFacade, 'httpOperations', 'get')
      .mockReturnValue(fakeHttpOperations);
    const httpLoader = new MemoryLoader(graphFacade);

    const operations = await httpLoader.load();
    expect(operations).toStrictEqual(fakeHttpOperations);

    spy.mockRestore();
  });
});
