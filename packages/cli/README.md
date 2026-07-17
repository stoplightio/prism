# prism-cli

You can install the command line CLI using `npm i -g @stoplight/prism-cli`

To get an overview of all the commands, just do `prism help`

## Documentation

Read me about the [Prism CLI](../../docs/getting-started/03-cli.md).

## Development

### Debugging

1. `npm run cli:debug -- mock file.oas.yml`
2. Run your preferred debugger on the newly created process. If you're into VS Code, you can create `.vscode/launch.json` and put this content inside:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "port": 9229
},
```

4. Enjoy the breakpoints :)

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

<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=5a343b5d-430b-4fea-8299-845b23c0b407&page=README.md" />
