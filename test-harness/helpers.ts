import { Dictionary } from '@stoplight/types/dist';
import * as xmlDiff from 'diff-js-xml';
import * as parser from 'fast-xml-parser';
import * as typeIs from 'type-is';

type Result = { body: string; headers: Dictionary<string> };

export const xmlValidator = {
  test: (contentType: string, content: string) => {
    const doesContentTypeMatch = !!typeIs.is(contentType, [
      'application/xml',
      'application/*+xml',
      'text/xml',
    ]);
    const isContentXML = parser.validate(content) === true;

    return doesContentTypeMatch || isContentXML;
  },
  validate: (expected: Result, output: Result) => {
    return new Promise(res =>
      xmlDiff.diffAsXml(expected.body, output.body, {}, { compareElementValues: false }, result =>
        res(result)
      )
    );
  },
};

export function parseSpecFile(spec: string) {
  const regex = /====(server|test|spec|command|expect|expect-loose)====\r?\n/gi;
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
    expectLoose: splitted[1 + expectLooseIndex],
  };
}
