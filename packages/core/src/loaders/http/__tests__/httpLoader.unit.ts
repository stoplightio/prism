import { HttpLoader } from '../';
jest.mock('../../../utils/graphFacade');
jest.mock('axios');
import axios from 'axios';
import { GraphFacade } from '../../../utils/graphFacade';

describe('httpLoader', () => {
  const fakeHttpOperations = ['a', 'b', 'c'];
  let graphFacadeMock: any;

  beforeEach(() => {
    graphFacadeMock = new GraphFacade();
    Object.defineProperty(graphFacadeMock, 'httpOperations', {
      get: jest.fn().mockReturnValue(fakeHttpOperations),
    });
    ((axios as unknown) as jest.Mock).mockResolvedValue({ data: 'a data' });
  });

  test('given no opts should delegate to graph facade for http operations', async () => {
    const httpLoader = new HttpLoader(graphFacadeMock);

    const operations = await httpLoader.load({ url: 'a url' });

    expect(axios).toHaveBeenCalledWith({ url: 'a url', transformResponse: expect.any(Function) });
    expect(operations).toBe(fakeHttpOperations);
  });
});
