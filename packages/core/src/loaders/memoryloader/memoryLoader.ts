import { IHttpOperation } from '@stoplight/types';
import { GraphFacade } from '../../utils/graphFacade';

export class MemoryLoader {
  constructor(private graphFacade: GraphFacade = new GraphFacade()) {}

  public async load(): Promise<IHttpOperation[]> {
    return this.graphFacade.httpOperations;
  }
}

export default MemoryLoader;
