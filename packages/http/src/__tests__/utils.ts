import { Either } from 'fp-ts/lib/Either';

export function assertRight<L, A>(e: Either<L, A>, onRight: (a: A) => void) {
  e.fold(l => {
    throw new Error('Right expected, got a Left: ' + l);
  }, onRight);
}

export function assertLeft<L, A>(e: Either<L, A>, onLeft: (a: L) => void) {
  e.fold(onLeft, a => {
    throw new Error('Left expected, got a Right: ' + a);
  });
}
