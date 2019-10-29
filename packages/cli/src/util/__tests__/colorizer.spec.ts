import chalk from 'chalk';
import {
  PRE_PARAM_VALUE_TAG,
  POST_PARAM_VALUE_TAG,
  attachTagsToParamsValues,
  transformPathParamsValues
} from '../colorizer';

describe('colorizer', () => {

  describe('transformPathParamsValues()', () => {
    it('colorizes tagged values of query params', () => {
      const paramVal = 'sold,pending';
      const path = `/no_auth/pets/findByStatus?status=${PRE_PARAM_VALUE_TAG},${paramVal},${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/findByStatus?status=${chalk.bold.blue(paramVal)}`);
    });

    it('colorizes tagged values of path params', () => {
      const paramVal = 651;
      const path = `/no_auth/pets/${PRE_PARAM_VALUE_TAG},${paramVal},${POST_PARAM_VALUE_TAG}`;

      expect(transformPathParamsValues(path, chalk.bold.blue)).toBe(`/no_auth/pets/${chalk.bold.blue(`${paramVal}`)}`);
    });

    it('colorizes values that are equal to multiple or single , characters', () => {
      const paramVal = ',,,,,,,,,,,,,';
      const path = `/no_auth/pets/${PRE_PARAM_VALUE_TAG},${paramVal},${POST_PARAM_VALUE_TAG}`;

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
            PRE_PARAM_VALUE_TAG,
            'available',
            'pending',
            'sold',
            POST_PARAM_VALUE_TAG
          ]
        });
      });

      describe('tagging single values', () => {
        it('tags string values', () => {
          const val = 'dignissimos';
          const valuesOfParams = {
            name: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            name: [
              PRE_PARAM_VALUE_TAG,
              val,
              POST_PARAM_VALUE_TAG
            ]
          });
        });

        it('tags numeric values', () => {
          const val = 170;
          const valuesOfParams = {
            petId: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            petId: [
              PRE_PARAM_VALUE_TAG,
              `${val}`,
              POST_PARAM_VALUE_TAG
            ]
          });
        });

        it('tags values that are equal to multiple or single , characters', () => {
          const val = ',,,,,';
          const valuesOfParams = {
            name: val
          };

          expect(attachTagsToParamsValues(valuesOfParams)).toStrictEqual({
            name: [
              PRE_PARAM_VALUE_TAG,
              val,
              POST_PARAM_VALUE_TAG
            ]
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
