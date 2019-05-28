import { httpInputs, httpOperations, httpOutputs } from '../../__tests__/fixtures';
import { validator } from '../index';

const BAD_INPUT = Object.assign({}, httpInputs[2], {
  body: '{"name":"Shopping","completed":"yes"}',
  url: Object.assign({}, httpInputs[2].url, { query: { overwrite: 'true' } }),
  headers: { 'x-todos-publish': 'yesterday' },
});

const GOOD_INPUT = Object.assign({}, httpInputs[2], {
  url: Object.assign({}, httpInputs[0].url, { query: { completed: true } }),
});

const BAD_OUTPUT = Object.assign({}, httpOutputs[1], {
  body: '{"name":"Shopping","completed":"yes"}',
  headers: { 'x-todos-publish': 'yesterday' },
});

describe('HttpValidator', () => {
  describe('validateInput()', () => {
    describe('all validations are turned on', () => {
      it('returns validation errors for whole request structure', async () => {
        expect(await validator.validateInput({ resource: httpOperations[2], input: BAD_INPUT })).toMatchSnapshot();
      });

      describe('when all required params are provided', () => {
        it('returns no validation errors', async () => {
          expect(await validator.validateInput({ resource: httpOperations[0], input: GOOD_INPUT })).toEqual([]);
        });
      });
    });

    describe('only headers validation is turned on', () => {
      it('returns only headers validation errors', async () => {
        expect(
          await validator.validateInput({
            resource: httpOperations[2],
            input: BAD_INPUT,
            config: { mock: false, validate: { request: { headers: true, query: false, body: false } } },
          }),
        ).toMatchSnapshot();
      });
    });

    describe('only query validation is turned on', () => {
      it('returns only query validation errors', async () => {
        expect(
          await validator.validateInput({
            resource: httpOperations[2],
            input: BAD_INPUT,
            config: { mock: false, validate: { request: { headers: false, query: true, body: false } } },
          }),
        ).toMatchSnapshot();
      });

      describe('when all required params are provided', () => {
        it('returns no validation errors', async () => {
          expect(
            await validator.validateInput({
              resource: httpOperations[0],
              input: GOOD_INPUT,
              config: { mock: false, validate: { request: { headers: false, query: true, body: false } } },
            }),
          ).toEqual([]);
        });
      });
    });

    describe('only body validation is turned on', () => {
      it('returns only body validation errors', async () => {
        expect(
          await validator.validateInput({
            resource: httpOperations[2],
            input: BAD_INPUT,
            config: { mock: false, validate: { request: { headers: false, query: false, body: true } } },
          }),
        ).toMatchSnapshot();
      });
    });

    describe('all validations are turned off', () => {
      it('returns no validation errors', async () => {
        expect(
          await validator.validateInput({
            resource: httpOperations[2],
            input: BAD_INPUT,
            config: { mock: false, validate: { request: false } },
          }),
        ).toMatchSnapshot();
      });
    });
  });

  describe('validateOutput()', () => {
    describe('all validations are turned on', () => {
      it('returns validation errors for whole request structure', async () => {
        expect(await validator.validateOutput({ resource: httpOperations[1], output: BAD_OUTPUT })).toMatchSnapshot();
      });
    });

    describe('only headers validation is turned on', () => {
      it('returns only headers validation errors', async () => {
        expect(
          await validator.validateOutput({
            resource: httpOperations[1],
            output: BAD_OUTPUT,
            config: { mock: false, validate: { response: { headers: true, body: false } } },
          }),
        ).toMatchSnapshot();
      });
    });

    describe('only body validation is turned on', () => {
      it('returns only body validation errors', async () => {
        expect(
          await validator.validateOutput({
            resource: httpOperations[1],
            output: BAD_OUTPUT,
            config: { mock: false, validate: { response: { headers: false, body: true } } },
          }),
        ).toMatchSnapshot();
      });
    });

    describe('all validations are turned off', () => {
      it('returns no validation errors', async () => {
        expect(
          await validator.validateOutput({
            resource: httpOperations[1],
            output: BAD_OUTPUT,
            config: { mock: false, validate: { response: false } },
          }),
        ).toMatchSnapshot();
      });
    });
  });
});
