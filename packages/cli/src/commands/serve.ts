import { Command, flags as oflags } from '@oclif/command';
import { httpLoaderInstance } from '@stoplight/prism-core';
import { createServer } from '@stoplight/prism-http-server';

export default class Serve extends Command {
  public static description = 'Start a server with the given spec file';
  public static flags = {
    port: oflags.integer({
      char: 'p',
      description: 'Port that Prism will run on.',
      default: 4010,
      required: true,
    }),
    spec: oflags.string({
      char: 's',
      description: 'Path to a spec file',
      required: true,
    }),
    mock: oflags.boolean({
      char: 'm',
      description: 'Turn global mocking on or off',
      default: true,
    }),
  };

  public async run() {
    const {
      flags: { spec, mock, port },
    } = this.parse(Serve);

    const server =
      spec && isHttp(spec)
        ? createServer(
            { url: spec },
            { components: { loader: httpLoaderInstance }, config: { mock } }
          )
        : createServer({ path: spec }, { config: { mock } });

    const address = await server.listen(port);

    this.log(address);
  }
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
