import { Command, flags as oflags } from '@oclif/command';
import { httpLoaderInstance } from '@stoplight/prism-core';
import { TPrismHttpComponents } from '@stoplight/prism-http';
import { createServer } from '@stoplight/prism-http-server';
import { existsSync, statSync } from 'fs';

export default class Serve extends Command {
  public static description = 'Start a server with the given spec file';
  public static flags = {
    port: oflags.integer({
      char: 'p',
      description: 'Port that Prism will run on.',
      default: 4010,
    }),
    spec: oflags.string({
      char: 's',
      description: 'Path to a spec file',
    }),
    mock: oflags.boolean({
      char: 'm',
      description: 'Turn global mocking on or off',
      default: false,
    }),
  };

  public async run() {
    const { flags } = this.parse(Serve);
    const { port, spec, mock } = flags;

    await this.validateSpecPath(spec);

    const server = this.createServer({ spec, mock });
    const address = await server.listen(port as number);

    this.log(address);
  }

  private createServer({ spec, mock }: { spec?: string; mock: boolean }) {
    const components: TPrismHttpComponents<any> = {};
    if (!mock) components.config = { mock: false };

    if (spec && isHttp(spec)) {
      return createServer(
        { url: spec },
        { components: { ...components, loader: httpLoaderInstance } }
      );
    } else {
      return createServer({ path: spec }, { components });
    }
  }

  private validateSpecPath(spec?: string) {
    if (!spec || isHttp(spec)) {
      return;
    }

    if (!existsSync(spec)) {
      this.error(`Non-existing path to spec supplied: ${spec}`);
      this.exit(0x01);
      return;
    }

    const stats = statSync(spec);

    if (stats.isDirectory()) {
      this.error(`Supplied spec path points to directory. Only files are supported.`);
      this.exit(0x02);
      return;
    }
  }
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
