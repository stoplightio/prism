export function parseSpecFile(spec: string) {
  const regex = /====(server|test|spec|command|expect)====\r?\n/gi;
  const splitted = spec.split(regex);

  const testIndex = splitted.findIndex(t => t === 'test');
  const specIndex = splitted.findIndex(t => t === 'spec');
  const serverIndex = splitted.findIndex(t => t === 'server');
  const commandIndex = splitted.findIndex(t => t === 'command');
  const expectIndex = splitted.findIndex(t => t === 'expect');
  const expectLooseIndex = splitted.findIndex(t => t === 'expect-loose');

  return {
    test: splitted[1 + testIndex],
    spec: splitted[1 + specIndex],
    server: splitted[1 + serverIndex],
    command: splitted[1 + commandIndex],
    expect: splitted[1 + expectIndex],
    expectLooseIndex: splitted[1 + expectLooseIndex],
  };
}
