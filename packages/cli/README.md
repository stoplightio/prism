# prism-cli

You can install the command line CLI using `npm i -g @stoplight/prism-cli`

To get an overview of all the commands, just do `prism help`

## Running in production

When running in development mode (which happens when the `NODE_ENV` environment variable is not set to `production`) or the `-m` flag is set to false, both the HTTP Server and the CLI (which is responsible of parsing and showing the received logs on the screen) will run within the same process.

Processing logs slows down the process significantly. If you're planning to use the CLI in production (for example in a Docker Container) we recommend to run the CLI with the `-m` flag or set the `NODE_ENV` variable to `production`. In this way, the CLI and the HTTP server will run on two different processes, so that logs processing, parsing and printing does not slow down the http requests processing.

## Development

### Debugging

1. `yarn cli:debug mock file.oas.yml`
2. Run your preferred debugger on the newly created process. If you're into VSCoode, you can create `.vscode/launch.json` and put this content inside:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "port": 9229
},
```

4. Enjoy the breakpoints :)
