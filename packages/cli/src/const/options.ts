import { flags as oflags } from '@oclif/command';

export const ARGS = {
  spec: {
    name: 'spec',
    description: 'Path to a spec file',
    required: true,
  },
};

export const FLAGS = {
  port: oflags.integer({
    char: 'p',
    description: 'Port that Prism will run on.',
    default: 4010,
    required: true,
  }),

  dynamic: oflags.boolean({
    char: 'd',
    description: 'Dynamically generate examples.',
    default: false,
  }),
};
