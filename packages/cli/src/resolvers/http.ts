import { Resolver } from '@stoplight/json-ref-resolver';

import axios from 'axios';

export const httpReader = {
  resolve(ref: unknown) {
    return axios.get(String(ref)).then(d => d.data);
  },
};

// resolves http and https $refs, and internal $refs
export const httpResolver = new Resolver({
  resolvers: {
    https: httpReader,
    http: httpReader,
  },
});
