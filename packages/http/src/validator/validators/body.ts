import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IMediaTypeContent } from '@stoplight/types';

import { validate } from 'fast-xml-parser';
import { is } from 'type-is';
import { validateAgainstSchema } from '../validators/utils';
import { IHttpValidator } from './types';

type Validation = { title: string; detail: string; severity: number; message: string };
type Validator = { test: (a: string) => boolean; validate: (a: string) => Validation[] };

const validatorsOfExamples: Validator[] = [
  {
    test: (mediaType: string) => !!is(mediaType, ['application/*+xml', 'application/xml']),
    validate: (target: string) => {
      const validationResult = validate(target);

      return validationResult === true
        ? []
        : [
            {
              title: 'Provided example is not an XML file',
              detail: validationResult.err.code,
              severity: 0,
              message: validationResult.err.msg,
            },
          ];
    },
  },
];

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private _prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): IPrismDiagnostic[] {
    const { _prefix: prefix } = this;
    const content = this.getContent(specs, mediaType);

    if (!content) {
      return [];
    }

    if (!content.schema) {
      return checkExamples(target, mediaType);
    }

    return validateAgainstSchema(target, content.schema).map(error =>
      Object.assign({}, error, { path: [prefix, ...(error.path || [])] }),
    );
  }

  private getContent(specs: IMediaTypeContent[], mediaType?: string): IMediaTypeContent | undefined {
    if (!mediaType) {
      return specs[0];
    }

    const content = specs.find(c => c.mediaType === mediaType);

    if (!content) {
      return specs[0];
    }

    return content;
  }
}

function checkExamples(target: any, mediaType: string = '') {
  const matchedValidator = validatorsOfExamples.find((validator: Validator) => validator.test(mediaType));
  const validation = matchedValidator && matchedValidator.validate(target);

  return validation ? validation : [];
}
