# prism-cli

You can install the command line CLI using `npm i -g @stoplight/prism-cli`

To get an overview of all the commands, just do `prism help`

## Documentation

Read me about the [Prism CLI](../../docs/getting-started/03-cli.md).

## Development

### Debugging

1. `yarn cli:debug mock file.oas.yml`
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
