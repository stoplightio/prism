import getHttpOperations from '../getHttpOperations';

describe('getHttpOperations()', () => {
  describe('ref resolving fails', () => {
    it('fails with exception', () => {
      return expect(
        getHttpOperations(
          JSON.stringify({
            openapi: '3.0.0',
            paths: { $ref: 'abc://' },
          })
        )
      ).rejects.toThrow(
        /^There's been an error while trying to resolve external references in your document: Error: EISDIR: illegal operation on a directory, read$/
      );
    });

    it('deduplicates similar errors', () => {
      return expect(
        getHttpOperations(
          JSON.stringify({
            openapi: '3.0.0',
            paths: { $ref: 'abc://' },
            definitions: { $ref: 'abc://' },
          })
        )
      ).rejects.toThrow(
        /^There's been an error while trying to resolve external references in your document: Error: EISDIR: illegal operation on a directory, read$/
      );
    });
  });

  describe('ref resolving succeeds', () => {
    describe('OpenAPI 2 document is provided', () => {
      it('detects it properly', () => {
        return expect(getHttpOperations(JSON.stringify({ swagger: '2.0' }))).resolves.toBeTruthy();
      });
    });

    describe('OpenAPI 3 document is provided', () => {
      it('detects it properly', () => {
        return expect(getHttpOperations(JSON.stringify({ openapi: '3.0.0' }))).resolves.toBeTruthy();
      });

      it('returns correct HttpOperation', () => {
        return expect(
          getHttpOperations(
            JSON.stringify({
              openapi: '3.0.0',
              paths: {
                '/pet': { get: { responses: { 200: { description: 'test' } } } },
              },
            })
          )
        ).resolves.toEqual([
          expect.objectContaining({
            method: 'get',
            path: '/pet',
            responses: [
              {
                code: '200',
                contents: [],
                description: 'test',
                headers: [],
              },
            ],
          }),
        ]);
      });
    });

    describe('Postman Collection document is provided', () => {
      it('detects it properly', () => {
        return expect(getHttpOperations(JSON.stringify({ info: { name: 'Test' }, item: [] }))).resolves.toBeTruthy();
      });
    });

    describe('unknown document is provided', () => {
      it('throws error', () => {
        return expect(getHttpOperations(JSON.stringify({}))).rejects.toThrow(/^Unsupported document format$/);
      });
    });
  });
});
