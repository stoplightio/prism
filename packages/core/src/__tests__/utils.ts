import * as O from 'fp-ts/Option';
import { noop } from 'lodash';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

export function assertNone<A>(e: O.Option<A>): asserts e is O.None {
  pipe(
    e,
    O.fold(
      () => ({}),
      a => {
        throw new Error(`None expected, got a Some: ${a}`);
      }
    )
  );
}

export function assertSome<A>(e: O.Option<A>, onSome: (a: A) => void = noop): asserts e is O.Some<A> {
  pipe(
    e,
    O.fold(() => {
      throw new Error('Some expected, got a None');
    }, onSome)
  );
}

export function assertRight<L, A>(e: E.Either<L, A>, onRight: (a: A) => void = noop): asserts e is E.Right<A> {
  pipe(
    e,
    E.fold(l => {
      throw new Error(`Right expected, got a Left: ${l}`);
    }, onRight)
  );
}

export function assertLeft<L, A>(e: E.Either<L, A>, onLeft: (a: L) => void = noop): asserts e is E.Left<L> {
  pipe(
    e,
    E.fold(onLeft, a => {
      throw new Error(`Left expected, got a Right: ${a}`);
    })
  );
}

export async function assertResolvesRight<L, A>(e: TE.TaskEither<L, A>, onRight: (a: A) => void = noop) {
  assertRight(await e(), onRight);
}

export async function assertResolvesLeft<L, A>(e: TE.TaskEither<L, A>, onLeft: (a: L) => void = noop) {
  assertLeft(await e(), onLeft);
}
