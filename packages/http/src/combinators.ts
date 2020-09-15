import { IPrismDiagnostic } from '@stoplight/prism-core';
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { sequenceT } from 'fp-ts/Apply';
import { getSemigroup } from 'fp-ts/NonEmptyArray';
import { getValidation } from 'fp-ts/Either';

export const traverseOption = A.array.traverse(O.option);
export const sequenceOption = sequenceT(O.option);
export const sequenceValidation = sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()));
