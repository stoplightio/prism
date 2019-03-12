import { IGraphite } from '@stoplight/graphite';
import {
  createFileSystemBackend,
  FileSystemBackend,
  FilesystemNodeType,
} from '@stoplight/graphite/backends/filesystem';
import { NodeCategory } from '@stoplight/graphite/graph/nodes';
import { createGraphite } from '@stoplight/graphite/graphite';
import { createOas2HttpPlugin } from '@stoplight/graphite/plugins/http/oas2';
import { createOas3HttpPlugin } from '@stoplight/graphite/plugins/http/oas3';
import { createJsonPlugin } from '@stoplight/graphite/plugins/json';
import { createOas2Plugin } from '@stoplight/graphite/plugins/oas2';
import { createYamlPlugin } from '@stoplight/graphite/plugins/yaml';
import { IHttpOperation } from '@stoplight/types';
import * as fs from 'fs';
import { extname, join } from 'path';

import compact = require('lodash/compact');

export class GraphFacade {
  private fsBackend: FileSystemBackend;
  private graphite: IGraphite;

  constructor() {
    const graphite = (this.graphite = createGraphite());
    graphite.registerPlugins(
      createJsonPlugin(),
      createYamlPlugin(),
      createOas2Plugin(),
      createOas2HttpPlugin(),
      createOas3HttpPlugin()
    );
    this.fsBackend = createFileSystemBackend(graphite, fs);
  }

  public async createFilesystemNode(fsPath: string | undefined) {
    if (fsPath) {
      const resourceFile = join(process.cwd(), fsPath);
      const subtype = extname(resourceFile).slice(1);
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
          subtype,
          path: resourceFile,
        });
        this.fsBackend.readFile(resourceFile);
      }
      await this.graphite.scheduler.drain();
      return;
    }
    return null;
  }

  get httpOperations(): IHttpOperation[] {
    const nodes = this.graphite.graph.virtualNodes.filter(node => node.type === 'http_operation');
    return compact(nodes.map<IHttpOperation>(node => node.data as IHttpOperation));
  }
}
