import { FilesystemNodeType } from '@stoplight/graphite/backends/filesystem';
import { IHttpOperation } from '@stoplight/types';
import axios from 'axios';
import { IHttpLoaderOpts } from '../../types';
import { GraphFacade } from '../../utils/graphFacade';

export class HttpLoader {
  constructor(private graphFacade: GraphFacade = new GraphFacade()) {}

  public async load(opts?: IHttpLoaderOpts): Promise<IHttpOperation[]> {
    if (!opts || !opts.url) return [];

    const response = await axios({ url: opts.url, transformResponse: d => d });

    await this.graphFacade.createRawNode(response.data, {
      type: FilesystemNodeType.File,
      path: opts.url,
    });

    return this.graphFacade.httpOperations;
  }
}

export default HttpLoader;
