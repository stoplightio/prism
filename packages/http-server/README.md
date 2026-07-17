# Prism Server

**NOTE:** The current API is still experimental and could change with no notice. Use at your own risk.

Usage:

```javascript
const { createServer } = require('@stoplight/prism-http-server');
const { getHttpOperationsFromSpec } = require('@stoplight/prism-cli/dist/operations');
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
      isProxy: false,
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

## Anonymized analytics

Prism uses [Scarf](https://scarf.sh/) to collect [anonymized installation analytics](https://github.com/scarf-sh/scarf-js?tab=readme-ov-file#as-a-user-of-a-package-using-scarf-js-what-information-does-scarf-js-send-about-me). These analytics help support the maintainers of this library and ONLY run during installation. To [opt out](https://github.com/scarf-sh/scarf-js?tab=readme-ov-file#as-a-user-of-a-package-using-scarf-js-how-can-i-opt-out-of-analytics), you can set the `scarfSettings.enabled` field to `false` in your project's `package.json`:

```
// package.json
{
  // ...
  "scarfSettings": {
    "enabled": false
  }
  // ...
}
```

Alternatively, you can set the environment variable `SCARF_ANALYTICS` to `false` as part of the environment that installs your npm packages, e.g., `SCARF_ANALYTICS=false npm install`.

<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=6cab5318-35c8-4dff-b6de-7007ba44442c&page=README.md" />
