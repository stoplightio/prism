# Prism Server

**NOTE:** The current API is still experimental and could change with no notice. Use at your own risk.

Usage:

```js
import { createServer } from '@stoplight/prism-http-server';

const server = createServer({
  path: './api.oas2.json',
  {}
});

server.listen(3000).then(() => {
  console.log('server is listening!');
});
```
