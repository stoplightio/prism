import { serializeWithFormStyle } from '../form';

describe('serializeWithFormStyle', () => {
  const name = 'color';
  describe('when value is null', () => {
    const value = null;
    it('explode is true', () => {
      expect(serializeWithFormStyle(name, value, true)).toEqual(`${name}=`);
    });

    it('explode is false', () => {
      expect(serializeWithFormStyle(name, value, false)).toEqual(`${name}=`);
    });
  });

  describe('when value is a string', () => {
    const value = 'blue';

    it('explode is true', () => {
      expect(serializeWithFormStyle(name, value, true)).toEqual(`${name}=${value}`);
    });

    it('explode is false', () => {
      expect(serializeWithFormStyle(name, value, false)).toEqual(`${name}=${value}`);
    });
  });

  describe('when value is an array', () => {
    const value = ['blue', 'black', 'brown'];

    it('explode is true', () => {
      expect(serializeWithFormStyle(name, value, true)).toEqual(`${name}=blue&${name}=black&${name}=brown`);
    });

    it('explode is false', () => {
      expect(serializeWithFormStyle(name, value, false)).toEqual(`${name}=blue,black,brown`);
    });
  });

  describe('when value is an object', () => {
    const value = { R: 100, G: 200, B: 150 };

    it('explode is true', () => {
      expect(serializeWithFormStyle(name, value, true)).toEqual('R=100&G=200&B=150');
    });

    it('explode is false', () => {
      expect(serializeWithFormStyle(name, value, false)).toEqual(`${name}=R,100,G,200,B,150`);
    });
  });
});
