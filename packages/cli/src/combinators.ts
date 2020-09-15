import * as E from 'fp-ts/Either';
import * as A from 'fp-ts/Array';
import { sequenceS } from 'fp-ts/Apply';

export const traverseEither = A.array.traverse(E.either);
export const sequenceSEither = sequenceS(E.either);
