import * as chalk from 'chalk';
import {
  PRE_PARAM_VALUE_TAG,
  POST_PARAM_VALUE_TAG,
  attachTagsToParamsValues,
  transformPathParamsValues,
} from '../colorizer';

describe('colorizer', () => {
  describe('transformPathParamsValues()', () => {
    it('colorizes tagged values of query params', () => {
      const path = `/no_auth/pets/findByStatus?status=${PRE_PARAM_VALUE_TAG}sold,pending${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(
        `/no_auth/pets/findByStatus?status=${chalk.bold.blue('sold,pending')}`
      );
    });

    it('colorizes tagged values of path params', () => {
      const path = `/no_auth/pets/${PRE_PARAM_VALUE_TAG}651${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/${chalk.bold.blue('651')}`);
    });
  });

  describe('attachTagsToParamsValues()', () => {
    describe('adding tags', () => {
      it('tags multiple values', () => {
        const values = {
          status: ['available', 'pending', 'sold'],
        };

        expect(attachTagsToParamsValues(values)).toStrictEqual({
          status: [
            `${PRE_PARAM_VALUE_TAG}available${POST_PARAM_VALUE_TAG}`,
            `${PRE_PARAM_VALUE_TAG}pending${POST_PARAM_VALUE_TAG}`,
            `${PRE_PARAM_VALUE_TAG}sold${POST_PARAM_VALUE_TAG}`,
          ],
        });
      });

      describe('tagging single values', () => {
        it('tags string values', () => {
          const valuesOfParams = {
            name: 'dignissimos',
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            name: `${PRE_PARAM_VALUE_TAG}dignissimos${POST_PARAM_VALUE_TAG}`,
          });
        });

        it('tags numeric values', () => {
          const valuesOfParams = {
            petId: 170,
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            petId: `${PRE_PARAM_VALUE_TAG}170${POST_PARAM_VALUE_TAG}`,
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
