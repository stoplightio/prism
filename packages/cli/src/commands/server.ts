import { Command, flags as oflags } from '@oclif/command';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a server with the given spec file';
  public static flags = {
    port: oflags.integer({
      char: 'p',
      description: 'Port that Prism will run on.',
      default: 4010,
      required: true,
    }),
  };
  public static args = [
    {
      name: 'spec',
      description: 'Path to a spec file',
      required: true,
    },
  ];

  public async run() {
    const {
      flags: { port },
      args: { spec },
    } = this.parse(Server);

    const server = createServer(spec, { mock: false });

    const address = await server.listen(port);

    this.log(address);
  }
}
