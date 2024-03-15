import { FakeIncomingMessage } from '../fakeIncomingMessage';
import * as typeIs from 'type-is';

describe('FakeIncomingMessage', () => {
  it('fools isType when there is a body', () => {
    // Arrange
    const body = toUtf8('{}');
    const fake = new FakeIncomingMessage({
      method: 'POST',
      url: 'http://example.com/',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'UTF-8',
        'Content-Length': body.length.toString(),
      },
    });
    fake.write(body);

    // Act
    const actual = typeIs(fake, ['application/json']);

    // Assert
    expect(actual).toBeTruthy();
  });

  it('fools isType when there is NO body', () => {
    // Arrange
    const fake = new FakeIncomingMessage({
      method: 'GET',
      url: 'http://example.com/',
      headers: {
        Accept: 'application/json',
      },
    });

    // Act
    const actual = typeIs(fake, ['application/json']);

    // Assert
    expect(actual).toBeFalsy();
  });

  it('fools hasBody when there is a body', () => {
    // Arrange
    const body = toUtf8('{}');
    const fake = new FakeIncomingMessage({
      method: 'POST',
      url: 'http://example.com/',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'UTF-8',
        'Content-Length': body.length.toString(),
      },
    });
    fake.write(body);

    // Act
    const actual = typeIs.hasBody(fake);

    // Assert
    expect(actual).toBeTruthy();
  });

  it('fools hasBody when there is NO body', () => {
    // Arrange
    const fake = new FakeIncomingMessage({
      method: 'GET',
      url: 'http://example.com/',
      headers: {
        Accept: 'application/json',
      },
    });

    // Act
    const actual = typeIs.hasBody(fake);

    // Assert
    expect(actual).toBeFalsy();
  });
});

function toUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
