import { IPrismDiagnostic } from '@stoplight/prism-core';
import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import { sequenceT } from 'fp-ts/lib/Apply';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { getValidation } from 'fp-ts/lib/Either';
import { Do } from 'fp-ts-contrib/lib/Do';

export const traverseOption = A.array.traverse(O.option);
export const doOption = Do(O.option);
export const sequenceOption = sequenceT(O.option);
export const sequenceValidation = sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()));
