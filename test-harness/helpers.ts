import { Dictionary } from '@stoplight/types/dist';
import * as xmlDiff from 'diff-js-xml';
import * as parser from 'fast-xml-parser';
import { get, omit } from 'lodash';

type Result = { body: string; headers: Dictionary<string, string> };

const xmlValidator = {
  test: (contentType: string, content: string) => {
    const doesContentTypeMatch = !!contentType.match(/application\/.*xml/);
    const isContentXML = parser.validate(content) === true;

    return doesContentTypeMatch || isContentXML;
  },
  validate: (expected: Result, output: Result) => {
    const expectedInRootEl = `<root>${expected.body}</root>`;
    const outputInRootEl = `<root>${output.body}</root>`;

    xmlDiff.diffAsXml(expectedInRootEl, outputInRootEl, {}, { compareElementValues: false }, result =>
      expect(result).toStrictEqual([]),
    );

    expect(omit(output, 'body')).toMatchObject(omit(expected, 'body'));
  },
};

const validators = [xmlValidator];

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

export const validateLoosely = (expected: Result, output: Result) => {
  const foundValidator = validators.find(validator => {
    return validator.test(get(output, ['header', 'content-type'], ''), expected.body);
  });

  if (!!foundValidator) {
    foundValidator.validate(expected, output);
  } else {
    expect(output).toMatchObject(expected);
  }
};
