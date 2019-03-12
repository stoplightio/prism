import { hello } from './hello';

describe('hello', () => {
  test('hello', async () => {
    expect(await hello('hi')).toMatchObject({
      input: 'hi',
    });
  });
});
