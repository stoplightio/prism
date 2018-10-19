import { factory } from '../index';

describe('graph', () => {
  test('component functions pass the default component to user provided overrides', async () => {
    let defaultLoaderId = 0;
    let customLoaderId = 0;

    const createInstance = factory<any, any, any, any, { id: number }>({
      // the default loader, what implementations of prism define (prism-http, etc)
      loader: {
        load: async opts => {
          defaultLoaderId = opts && opts.id ? opts.id : 0;
          return [];
        },
      },
    });

    /**
     * the user imports createInstance from an implementation (like prism-http)
     * when creating an instance, the user can override any of the components, and receive the default component
     * as an argument
     */
    const prism = await createInstance({
      loader: {
        load: async (opts, defaultLoader) => {
          /**
           * end user can call, or not call, the parent loader
           * calling it will invoke the default load function above, setting defaultLoaderId
           * this allows one to hook before and after components functions are run,
           * and add their own custom logic, change the options passed through, or skip altogether
           */
          if (defaultLoader) {
            await defaultLoader.load(opts);
          }

          customLoaderId = opts && opts.id ? opts.id : 0;

          return [];
        },
      },
    })({
      id: 123,
    });

    await prism.resources;
    expect(defaultLoaderId).toEqual(123);
    expect(customLoaderId).toEqual(123);
  });

  test.skip('custom config function should merge over default config', async () => {
    const createInstance = factory<any, any, any, any, { id: number }>({
      config: {
        mock: true,
        validate: false,
      },
    });

    /**
     * the user imports createInstance from an implementation (like prism-http)
     * when creating an instance, the user can override any of the components, and receive the default component
     * as an argument
     */
    const prism = await createInstance({
      config: () => ({
        validate: true,
      }),
    })({
      id: 123,
    });

    // TODO: the resulting config that is used should be merged. not sure how to spy on it, but the below:
    // {
    //   mock: true,
    //   validate: true
    // }
  });

  test('load calls loader and sets resources', async () => {
    const createInstance = factory<any, any, any, any, { id: number }>({
      loader: {
        load: async opts => {
          return [opts ? opts.id : 0];
        },
      },
    });

    const prism = await createInstance()({
      id: 123,
    });

    const resources = await prism.resources;
    expect(resources).toEqual([123]);
  });

  describe('process', () => {
    test.skip('calls router to find the resource match', () => {
      // TODO
    });

    test.skip('runs validator on input', () => {
      // TODO
    });

    test.skip('calls mocker if config mock property is truthy', () => {
      // TODO
    });

    test.skip('calls forwarder if config mock property is falsy', () => {
      // TODO
    });

    test.skip('runs validator on output', () => {
      // TODO
    });
  });
});
