import * as axios from 'axios';

import { httpOperations, httpRequests } from '../../__tests__/fixtures';
import { HttpForwarder } from '../HttpForwarder';

describe('HttpForwarder', () => {
  const forwarder = new HttpForwarder();

  describe('forward()', () => {
    describe("parameters haven' been provided", () => {
      it('proxies request correctly', async () => {
        jest.spyOn(axios, 'default').mockResolvedValue({
          status: 200,
          headers: {
            'Content-type': 'application/json',
          },
          data: '[{},{}]',
          statusText: 'ok',
          config: {},
        });

        const request = Object.assign({}, httpRequests[0]);
        request.data.url.baseUrl = 'http://api.example.com';

        await forwarder.forward({ input: request });

        expect(axios.default).toHaveBeenCalledWith({
          method: 'get',
          url: '/todos',
          baseURL: 'http://api.example.com',
          responseType: 'text',
          validateStatus: expect.any(Function),
        });
      });
    });

    describe('parameters are valid', () => {
      describe('server url has no variables', () => {
        it('proxies request correctly', async () => {
          jest.spyOn(axios, 'default').mockResolvedValue({
            status: 200,
            headers: {
              'Content-type': 'application/json',
            },
            data: '[{},{}]',
            statusText: 'ok',
            config: {},
          });

          const response = await forwarder.forward({
            input: httpRequests[0],
            resource: Object.assign({}, httpOperations[0], {
              servers: [{ url: 'http://api.example.com' }],
            }),
          });

          expect(response).toMatchSnapshot();

          expect(axios.default).toHaveBeenCalledWith({
            method: 'get',
            url: '/todos',
            baseURL: 'http://api.example.com',
            responseType: 'text',
            validateStatus: expect.any(Function),
          });
        });
      });

      describe('server url has variables', () => {
        it('fails when variable is not defined', async () => {
          return expect(
            forwarder.forward({
              input: httpRequests[0],
              resource: Object.assign({}, httpOperations[0], {
                servers: [
                  {
                    url: 'http://{var1}.example.com',
                    variables: {
                      var2: {},
                    },
                  },
                ],
              }),
            })
          ).rejects.toThrowErrorMatchingSnapshot();
        });

        it('substitutes url with default variable values', async () => {
          await forwarder.forward({
            input: httpRequests[0],
            resource: Object.assign({}, httpOperations[0], {
              servers: [
                {
                  url: 'http://{var1}.example.com',
                  variables: {
                    var1: {
                      default: 'api',
                    },
                  },
                },
              ],
            }),
          });

          expect(axios.default).toHaveBeenCalledWith(
            expect.objectContaining({ baseURL: 'http://api.example.com', url: '/todos' })
          );
        });

        it('substitutes url with first variable value if there is no default one', async () => {
          await forwarder.forward({
            input: httpRequests[0],
            resource: Object.assign({}, httpOperations[0], {
              servers: [
                {
                  url: 'http://{var1}.example.com',
                  variables: {
                    var1: {
                      enum: ['api', 'api2'],
                    },
                  },
                },
              ],
            }),
          });

          expect(axios.default).toHaveBeenCalledWith(
            expect.objectContaining({ baseURL: 'http://api.example.com', url: '/todos' })
          );
        });
      });
    });
  });
});
