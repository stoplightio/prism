import { resolve } from 'path';
import Serve from '../serve';

describe('serve command', () => {
  it('throws error when supplied with non-existing path', async () => {
    return expect(Serve.run(['-s', 'a-non-existing-path'])).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throws error when supplied with a directory', async () => {
    return expect(Serve.run(['-s', resolve('examples')])).rejects.toThrowErrorMatchingSnapshot();
  });
});
