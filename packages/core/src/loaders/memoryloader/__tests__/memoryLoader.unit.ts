import { MemoryLoader } from '../';
jest.mock('../../../utils/graphFacade');
jest.mock('axios');
import { GraphFacade } from '../../../utils/graphFacade';

describe('httpLoader', () => {
  const fakeHttpOperations = ['a', 'b', 'c'];
  let graphFacadeMock: any;

  beforeEach(() => {
    graphFacadeMock = new GraphFacade();
    Object.defineProperty(graphFacadeMock, 'httpOperations', {
      get: jest.fn().mockReturnValue(fakeHttpOperations),
    });
  });

  test('should return nothing more what is in the facade', async () => {
    const httpLoader = new MemoryLoader(graphFacadeMock);

    const operations = await httpLoader.load();
    expect(operations).toBe(fakeHttpOperations);
  });
});
