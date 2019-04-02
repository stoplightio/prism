import { FilesystemNodeType } from '@stoplight/graphite/backends/filesystem';
import { IHttpOperation } from '@stoplight/types';
import axios from 'axios';
import trimStart = require('lodash/trimStart');
import { extname } from 'path';
import { IHttpLoaderOpts } from '../../types';
import { GraphFacade } from '../../utils/graphFacade';

export class HttpLoader {
  constructor(private graphFacade: GraphFacade) {}

  public async load(opts?: IHttpLoaderOpts): Promise<IHttpOperation[]> {
    if (!opts || !opts.url) return [];

    const response = await axios({ url: opts.url, transformResponse: d => d });

    await this.graphFacade.createRawNode(response.data, {
      type: FilesystemNodeType.File,
      language: trimStart(extname(opts.url), '.'),
    });

    return this.graphFacade.httpOperations;
  }
}

export const httpLoaderInstance = new HttpLoader(new GraphFacade());
