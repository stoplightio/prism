import { fold, Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

export function assertNone<A>(e: Option<A>) {
  pipe(
    e,
    fold(
      () => ({}),
      a => {
        throw new Error('None expected, got a Some: ' + a);
      },
    ),
  );
}

export function assertSome<A>(e: Option<A>, onSome: (a: A) => void) {
  pipe(
    e,
    fold(() => {
      throw new Error('Some expected, got a None');
    }, onSome),
  );
}
