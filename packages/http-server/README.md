# Prism Server

**NOTE:** The current API is still experimental and could change with no notice. Use at your own risk.

Usage:

```javascript
const { createServer } = require('@stoplight/prism-http-server');
const { getHttpOperationsFromSpec } = require('@stoplight/prism-http');
const { createLogger } = require('@stoplight/prism-core');

async function createPrismServer() {
  const operations = await getHttpOperationsFromSpec('YOUR-URL');

  const server = createServer(operations, {
    components: {
      logger: createLogger('TestLogger'),
    },
    cors: true,
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      mock: { dynamic: false },
      errors: false,
    },
  });
  await server.listen(4010);

  return {
    close: server.close.bind(server),
  };
}

const server = await createPrismServer();

server.close();
```
