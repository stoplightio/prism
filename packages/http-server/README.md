# Prism Server

**NOTE:** The current API is still experimental and could change with no notice. Use at your own risk.

Usage:

```js
import { createServer } from '@stoplight/prism-http-server';

const operations = await getHttpOperationsFromResource('./api.oas2.json');
const server = createServer({
  operations,
  { logger: createLoggerInstance() }
});

server.listen(3000).then(() => {
  console.log('server is listening!');
});
```
