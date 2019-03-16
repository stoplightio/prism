import { FilesystemNodeType } from '@stoplight/graphite/backends/filesystem';
import { IHttpLoaderOpts } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import axios from 'axios';
import trimStart = require('lodash/trimStart');
import { extname } from 'path';
import { GraphFacade } from '../../utils/graphFacade';

export function createLoadHttpResource(graphFacade: GraphFacade) {
  return async (url: string) => {
    const response = await axios({ url, responseType: 'text' });

    await graphFacade.createRawNode(response.data, {
      type: FilesystemNodeType.File,
      subtype: trimStart(extname(url), '.'),
    });

    return graphFacade.httpOperations;
  };
}

export class HttpLoader {
  constructor(private graphFacade: GraphFacade) {}

  public async load(opts?: IHttpLoaderOpts): Promise<IHttpOperation[]> {
    if (!opts || !opts.url) return [];

    const response = await axios({ url: opts.url, responseType: 'text' });

    await this.graphFacade.createRawNode(response.data, {
      type: FilesystemNodeType.File,
      subtype: trimStart(extname(opts.url), '.'),
    });

    return this.graphFacade.httpOperations;
  }
}

export const httpLoaderInstance = new HttpLoader(new GraphFacade());
