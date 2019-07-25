import { Resolver } from '@stoplight/json-ref-resolver';
import { extname } from '@stoplight/path';
import { parse } from '@stoplight/yaml';
import * as fs from 'fs';

import { httpReader } from './http';

// resolves files, http and https $refs, and internal $refs
export const httpAndFileResolver = new Resolver({
  resolvers: {
    https: httpReader,
    http: httpReader,
    file: {
      resolve(ref: any) {
        return new Promise((resolve, reject) => {
          const path = ref.path();
          fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(data);
          });
        });
      },
    },
  },

  parseResolveResult: async opts => {
    const ext = extname(opts.targetAuthority.toString());

    if (ext === '.yml' || ext === '.yaml') {
      opts.result = parse(opts.result);
    } else if (ext === '.json') {
      opts.result = JSON.parse(opts.result);
    }

    return opts;
  },
});
