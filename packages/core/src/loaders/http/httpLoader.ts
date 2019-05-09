import { IHttpOperation } from '@stoplight/types';
import axios from 'axios';
import * as fs from 'fs';
import { extname } from 'path';
import * as tmp from 'tmp';
import { IHttpLoaderOpts } from '../../types';
import { GraphFacade } from '../../utils/graphFacade';

tmp.setGracefulCleanup();

export class HttpLoader {
  constructor(private graphFacade: GraphFacade = new GraphFacade()) {}

  public async load(opts?: IHttpLoaderOpts): Promise<IHttpOperation[]> {
    if (!opts || !opts.url) return [];

    const filePath = tmp.tmpNameSync({ postfix: extname(opts.url) });
    const response = await axios({ url: opts.url, transformResponse: d => d });
    fs.writeFileSync(filePath, response.data, 'utf8');

    await this.graphFacade.createFilesystemNode(filePath);
    return this.graphFacade.httpOperations;
  }
}

export default HttpLoader;
