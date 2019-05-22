import { resolveRequestValidationConfig, resolveResponseValidationConfig } from '../config';

describe('resolveResponseValidationConfig()', () => {
  const defaultEnabledConfig = {
    headers: true,
    body: true,
  };

  const defaultDisabledConfig = {
    headers: false,
    body: false,
  };

  describe('config is not set', () => {
    it('resolves to default response config', () => {
      expect(resolveResponseValidationConfig()).toEqual(defaultEnabledConfig);
    });
  });

  describe('config is set', () => {
    describe('config.validate is not set', () => {
      it('resolves to default config', () => {
        expect(resolveResponseValidationConfig({ mock: { dynamic: false } })).toEqual(defaultEnabledConfig);
      });
    });

    describe('config.validate is set', () => {
      describe('config.validate.response is not set', () => {
        it('resolves to default config', () => {
          expect(resolveResponseValidationConfig({ mock: { dynamic: false }, validate: {} })).toEqual(
            defaultEnabledConfig,
          );
        });
      });

      describe('config.validate.request is set', () => {
        describe('response is a boolean', () => {
          describe('response is set to true', () => {
            it('resolves to all-enabled config', () => {
              expect(
                resolveResponseValidationConfig({ mock: { dynamic: false }, validate: { response: true } }),
              ).toEqual(defaultEnabledConfig);
            });
          });

          describe('response is set to false', () => {
            it('response to all-disabled config', () => {
              expect(
                resolveResponseValidationConfig({ mock: { dynamic: false }, validate: { response: false } }),
              ).toEqual(defaultDisabledConfig);
            });
          });
        });

        describe('response is an object', () => {
          describe('none parameters are set', () => {
            it('resolves to default config', () => {
              expect(resolveResponseValidationConfig({ mock: { dynamic: false }, validate: { response: {} } })).toEqual(
                defaultEnabledConfig,
              );
            });
          });

          describe('all parameters are set', () => {
            it('resolves to given config', () => {
              expect(
                resolveResponseValidationConfig({
                  mock: { dynamic: false },
                  validate: { response: defaultDisabledConfig },
                }),
              ).toEqual(defaultDisabledConfig);
            });
          });
        });
      });
    });
  });
});

describe('resolveRequestValidationConfig()', () => {
  const defaultEnabledConfig = {
    hijack: false,
    headers: true,
    query: true,
    body: true,
  };

  const defaultDisabledConfig = {
    hijack: false,
    headers: false,
    query: false,
    body: false,
  };

  describe('config is not set', () => {
    it('resolves to default request config', () => {
      expect(resolveRequestValidationConfig()).toEqual(defaultEnabledConfig);
    });
  });

  describe('config is set', () => {
    describe('config.validate is not set', () => {
      it('resolves to default config', () => {
        expect(resolveRequestValidationConfig({ mock: { dynamic: false } })).toEqual(defaultEnabledConfig);
      });
    });

    describe('config.validate is set', () => {
      describe('config.validate.request is not set', () => {
        it('resolves to default config', () => {
          expect(resolveRequestValidationConfig({ mock: { dynamic: false }, validate: {} })).toEqual(
            defaultEnabledConfig,
          );
        });
      });

      describe('config.validate.request is set', () => {
        describe('request is a boolean', () => {
          describe('request is set to true', () => {
            it('resolves to all-enabled config', () => {
              expect(resolveRequestValidationConfig({ mock: { dynamic: false }, validate: { request: true } })).toEqual(
                defaultEnabledConfig,
              );
            });
          });

          describe('request is set to false', () => {
            it('request to all-disabled config', () => {
              expect(
                resolveRequestValidationConfig({ mock: { dynamic: false }, validate: { request: false } }),
              ).toEqual(defaultDisabledConfig);
            });
          });
        });

        describe('request is an object', () => {
          describe('none parameters are set', () => {
            it('resolves to default config', () => {
              expect(resolveRequestValidationConfig({ mock: { dynamic: false }, validate: { request: {} } })).toEqual(
                defaultEnabledConfig,
              );
            });
          });

          describe('all parameters are set', () => {
            it('resolves to default config', () => {
              expect(
                resolveRequestValidationConfig({
                  mock: { dynamic: false },
                  validate: { request: defaultDisabledConfig },
                }),
              ).toEqual(defaultDisabledConfig);
            });
          });
        });
      });
    });
  });
});
