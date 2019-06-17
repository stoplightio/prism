import { PickRequired, ProblemJsonError } from '@stoplight/prism-http/src/types';
import { DiagnosticSeverity } from '@stoplight/types';
import { configMergerFactory, PartialPrismConfig, PrismConfig } from '.';
import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic } from './types';

export function factory<Resource, Input, Output, Config, LoadOpts>(
  defaultConfig: PrismConfig<Config, Input>,
  defaultComponents: Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>,
): (
  customConfig?: PartialPrismConfig<Config, Input>,
  customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>, 'logger'>,
) => IPrism<Resource, Input, Output, Config, LoadOpts> {
  const prism = (
    customConfig?: PartialPrismConfig<Config, Input>,
    customComponents?: PickRequired<Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>, 'logger'>,
  ) => {
    const components: PickRequired<
      Partial<IPrismComponents<Resource, Input, Output, Config, LoadOpts>>,
      'logger'
    > = Object.assign({}, defaultComponents, customComponents);

    // our loaded resources (HttpOperation objects, etc)
    let resources: Resource[] = [];

    return {
      get resources(): Resource[] {
        return resources;
      },

      load: async (opts?: LoadOpts): Promise<void> => {
        const { loader } = components;
        if (opts && loader) {
          resources = await loader.load(opts, defaultComponents.loader);
        }
      },

      process: async (input: Input, c?: Config) => {
        // build the config for this request
        const configMerger = configMergerFactory(defaultConfig, customConfig, c);
        const configObj: Config | undefined = configMerger(input);
        const inputValidations: IPrismDiagnostic[] = [];

        // find the correct resource
        let resource: Resource | undefined;
        if (components.router) {
          try {
            resource = components.router.route({ resources, input, config: configObj }, defaultComponents.router);
          } catch (error) {
            // rethrow error we if we're attempting to mock
            if ((configObj as IPrismConfig).mock) {
              throw error;
            }
            const { message, name, status } = error as ProblemJsonError;
            // otherwise let's just stack it on the inputValidations
            // when someone simply wants to hit an URL, don't block them
            inputValidations.push({
              message,
              source: name,
              code: status,
              severity: DiagnosticSeverity.Warning,
            });
          }
        }

        // validate input
        if (resource && components.validator && components.validator.validateInput) {
          inputValidations.push(
            ...(await components.validator.validateInput(
              {
                resource,
                input,
                config: configObj,
              },
              defaultComponents.validator,
            )),
          );
        }

        // build output
        let output: Output | undefined;
        if (resource && components.mocker && (configObj as IPrismConfig).mock) {
          // generate the response
          output = components.mocker
            .mock(
              {
                resource,
                input: { validations: { input: inputValidations }, data: input },
                config: configObj,
              },
              defaultComponents.mocker,
            )
            .run(components.logger.child({ name: 'MOCKER', input }))
            .fold(
              e => {
                throw e;
              },
              r => r,
            );
        } else if (components.forwarder) {
          // forward request and set output from response
          output = await components.forwarder.forward(
            {
              resource,
              input: { validations: { input: inputValidations }, data: input },
              config: configObj,
            },
            defaultComponents.forwarder,
          );
        }

        // validate output
        let outputValidations: IPrismDiagnostic[] = [];
        if (resource && components.validator && components.validator.validateOutput) {
          outputValidations = await components.validator.validateOutput(
            {
              resource,
              output,
              config: configObj,
            },
            defaultComponents.validator,
          );
        }

        return {
          input,
          output,
          validations: {
            input: inputValidations,
            output: outputValidations,
          },
        };
      },
    };
  };
  return prism;
}
