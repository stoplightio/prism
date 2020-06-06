import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import { Do } from 'fp-ts-contrib/lib/Do';
import { sequenceS } from 'fp-ts/lib/Apply';

export const traverseEither = A.array.traverse(E.either);
export const sequenceSEither = sequenceS(E.either);
export const doEither = Do(E.either);
