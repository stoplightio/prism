import { toError } from 'fp-ts/lib/Either';
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';

export const proxy = (x: any): TaskEither<Error, any> => {
  return tryCatch<Error, any>(
    async () => {
      return await x();
    },
    e => {
      return toError(e);
    },
  );
};

export const log = (inputValidations: any, outputValidations: any, config: any) => {
  if ((inputValidations.length || outputValidations.length) && config.proxy) {
    const validations = inputValidations.concat(outputValidations);

    if (config.log === 'error') {
      // TODO: respond with Prism errors
      console.error(validations);
    } else if (config.log === 'log') {
      console.log(validations);
    }
  }
};
