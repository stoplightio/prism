#!/usr/bin/env node

import chalk from 'chalk';
import { ChildProcess, fork } from 'child_process';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as signale from 'signale';

const argvWithoutNodeAndIndexFile = prepareArgvForTheFork(process.argv);

startAndReloadOnDocChange(forkTheServer());

function prepareArgvForTheFork(argv: string[]) {
  return argv.slice(2, argv.length);
}

function forkTheServer() {
  return fork(path.join(__dirname + '/util/runner'), argvWithoutNodeAndIndexFile);
}

function startAndReloadOnDocChange(serverFork: ChildProcess) {
  const documentPath = argvWithoutNodeAndIndexFile[1];

  if (documentPath) {
    const watcher = chokidar.watch(documentPath);

    watcher.on('change', () => {
      signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Restarting Prism…' });

      process.kill(serverFork.pid);

      watcher.unwatch(documentPath);
      watcher.close();

      startAndReloadOnDocChange(forkTheServer());
    });
  } else {
    forkTheServer();
  }
}
