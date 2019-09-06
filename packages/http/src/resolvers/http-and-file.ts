import { Resolver } from '@stoplight/json-ref-resolver';
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
    opts.result = parse(opts.result);
    return opts;
  },
});
