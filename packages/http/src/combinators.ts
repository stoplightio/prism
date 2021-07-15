import { IPrismDiagnostic } from '@stoplight/prism-core';
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { sequenceT } from 'fp-ts/Apply';
import { getSemigroup } from 'fp-ts/NonEmptyArray';
import { getApplicativeValidation } from 'fp-ts/Either';

export const traverseOption = A.traverse(O.Applicative);
export const sequenceOption = sequenceT(O.Apply);
export const sequenceValidation = sequenceT(getApplicativeValidation(getSemigroup<IPrismDiagnostic>()));
