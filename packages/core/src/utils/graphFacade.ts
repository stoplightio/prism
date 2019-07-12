import { IGraphite } from '@stoplight/graphite';
import {
  createFileSystemBackend,
  FileSystemBackend,
  FilesystemNodeType,
} from '@stoplight/graphite/backends/filesystem';
import { filenameToLanguage } from '@stoplight/graphite/backends/filesystem/utils';
import { ISourceNode, NodeCategory } from '@stoplight/graphite/graph/nodes';
import { createGraphite } from '@stoplight/graphite/graphite';
import { createOas2HttpPlugin } from '@stoplight/graphite/plugins/http/oas2';
import { createOas3HttpPlugin } from '@stoplight/graphite/plugins/http/oas3';
import { createJsonPlugin } from '@stoplight/graphite/plugins/json';
import { createOas2Plugin } from '@stoplight/graphite/plugins/oas2';
import { createOas3Plugin } from '@stoplight/graphite/plugins/oas3';
import { createYamlPlugin } from '@stoplight/graphite/plugins/yaml';
import { IHttpOperation } from '@stoplight/types';
import * as fs from 'fs';
import { resolve } from 'path';
import { parse } from 'url';

import { compact } from 'lodash';

export class GraphFacade {
  private fsBackend: FileSystemBackend;
  private graphite: IGraphite;

  constructor() {
    const graphite = (this.graphite = createGraphite());
    graphite.registerPlugins(
      createJsonPlugin(),
      createYamlPlugin(),
      createOas2Plugin(),
      createOas3Plugin(),
      createOas2HttpPlugin(),
      createOas3HttpPlugin(),
    );
    this.fsBackend = createFileSystemBackend(graphite, fs);
  }

  public async createFilesystemNode(fsPath: string) {
    const resourceFile = resolve(fsPath);
    const stat = fs.lstatSync(resourceFile);

    if (stat.isDirectory()) {
      this.graphite.graph.addNode({
        category: NodeCategory.Source,
        type: FilesystemNodeType.Directory,
        path: resourceFile,
      });
      this.fsBackend.readdir(fsPath);
    } else if (stat.isFile()) {
      this.graphite.graph.addNode({
        category: NodeCategory.Source,
        type: FilesystemNodeType.File,
        language: filenameToLanguage(resourceFile),
        path: resourceFile,
      });
      this.fsBackend.readFile(resourceFile);
    }

    await this.graphite.scheduler.drain();
  }

  public async createRawNode(raw: string, { type, path }: Pick<ISourceNode, 'type' | 'path'>) {
    const parsedPath = parse(path).pathname;

    if (!parsedPath) {
      throw new Error('Unable to parse the path.');
    }

    this.graphite.graph.addNode({
      category: NodeCategory.Source,
      type,
      language: filenameToLanguage(parsedPath),
      path: '/' + path,
      data: { raw },
    });

    await this.graphite.scheduler.drain();
  }

  get httpOperations(): IHttpOperation[] {
    const nodes = this.graphite.graph.virtualNodes.filter(node => node.type === 'http_operation');
    return compact(nodes.map<IHttpOperation>(node => node.data as IHttpOperation));
  }
}
