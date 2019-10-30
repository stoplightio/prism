import chalk from 'chalk';
import {
  PRE_PARAM_VALUE_TAG,
  POST_PARAM_VALUE_TAG,
  attachTagsToParamsValues,
  transformPathParamsValues
} from '../colorizer';

import { createPrismServerWithLogger } from '../createServer';
import { PassThrough } from 'stream';
import { createLogger } from '@stoplight/prism-core';
import * as httpServer from '@stoplight/prism-http-server';

const logStream = new PassThrough();
const logInstance = createLogger('CLI', undefined, logStream);

describe('colorizer', () => {

  if (chalk.supportsColor) {
    it('colorizes values for parameters', async () => {
      // @ts-ignore
      jest.spyOn(httpServer, 'createServer').mockImplementationOnce(() => {
        return {
          listen: () => {}
        }
      });

      jest.spyOn(logInstance, 'note').mockImplementation((aString) => {
        // @ts-ignore
        const coloredParam = aString.match(/(endpoint\/)(.*)/)[2];

        expect(coloredParam).toContain("\u001b[1m\u001b[36m");
        expect(coloredParam).toContain("\u001b[39m\u001b[22m");
      });

      await createPrismServerWithLogger({
        errors: false,
        multiprocess: false,
        host: 'localhost',
        port: 9999,
        cors: false,
        document: './examples/test.yaml',
        dynamic: false
      }, logInstance)
    })
  }

  describe('transformPathParamsValues()', () => {
    it('colorizes tagged values of query params', () => {
      const paramVal = 'sold,pending';
      const path = `/no_auth/pets/findByStatus?status=${PRE_PARAM_VALUE_TAG}${paramVal}${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/findByStatus?status=${chalk.bold.blue(paramVal)}`);
    });

    it('colorizes tagged values of path params', () => {
      const paramVal = 651;
      const path = `/no_auth/pets/${PRE_PARAM_VALUE_TAG}${paramVal}${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/${chalk.bold.blue(`${paramVal}`)}`);
    });

    it('colorizes values that are equal to multiple or single , characters', () => {
      const paramVal = ',,,,,,,,,,,,,';
      const path = `/no_auth/pets/${PRE_PARAM_VALUE_TAG}${paramVal}${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/${chalk.bold.blue(paramVal)}`);
    });
  });

  describe('attachTagsToParamsValues()', () => {

    describe('adding tags', () => {
      it('tags multiple values', () => {
        const values = {
          status: [
            'available',
            'pending',
            'sold'
          ]
        };

        expect(attachTagsToParamsValues(values)).toStrictEqual({
          status: [
            `${PRE_PARAM_VALUE_TAG}available${POST_PARAM_VALUE_TAG}`,
            `${PRE_PARAM_VALUE_TAG}pending${POST_PARAM_VALUE_TAG}`,
            `${PRE_PARAM_VALUE_TAG}sold${POST_PARAM_VALUE_TAG}`
          ]
        });
      })

      describe('tagging single values', () => {
        it('tags string values', () => {
          const val = 'dignissimos';
          const valuesOfParams = {
            name: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            name: `${PRE_PARAM_VALUE_TAG}${val}${POST_PARAM_VALUE_TAG}`,
          });
        });

        it('tags numeric values', () => {
          const val = 170;
          const valuesOfParams = {
            petId: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            petId: `${PRE_PARAM_VALUE_TAG}${val}${POST_PARAM_VALUE_TAG}`
          });
        });

        it('tags values that are equal to multiple or single , characters', () => {
          const val = ',,,,,';
          const valuesOfParams = {
            name: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            name: `${PRE_PARAM_VALUE_TAG}${val}${POST_PARAM_VALUE_TAG}`
          });
        });
      });
    });

    it('does not tag anything in case of no params', () => {
      const values = {};

      expect(attachTagsToParamsValues(values)).toStrictEqual({});
    });

  });
});
