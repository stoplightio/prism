import * as axios from 'axios';

import { httpOperations } from '../../__tests__/fixtures';
import { HttpForwarder } from '../HttpForwarder';

describe('HttpForwarder', () => {
  const forwarder = new HttpForwarder();

  describe('forward()', () => {
    // todo: this test should be moved to http-server functional tests as it has nothing to do with Forwarder implementation
    it('handles multipart/form-data', async () => {
      const body =
        '--------------------------a66059a71a48e542\\r\\nContent-Disposition: form-data; name="file"; filename="file.txt"\\r\\nContent-Type: text/plain\\r\\n\\r\\FILE!\\n\\r\\n--------------------------a66059a71a48e542\r\nContent-Disposition: form-data; name="test"\r\n\r\n1\r\n--------------------------a66059a71a48e542--\r\n';
      const contentType = 'multipart/form-data; boundary=------------------------a66059a71a48e542';

      jest.spyOn(axios, 'default').mockResolvedValue({
        data: body,
        status: 200,
        statusText: 'ok',
        headers: {
          'Content-type': contentType,
        },
        config: {},
      });

      const response = await forwarder.forward({
        input: {
          validations: { input: [] },
          data: {
            method: 'post',
            url: { path: '/files' },
            headers: {
              expect: '100-continue',
              'Content-type': contentType,
              'Content-length': '286',
            },
            body,
          },
        },
        resource: Object.assign({}, httpOperations[0], {
          servers: [{ url: 'http://api.example.com' }],
        }),
      });

      expect(response).toMatchSnapshot();
    });
  });
});
