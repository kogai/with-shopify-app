export * from 'option-t/cjs/PlainResult'
import { Result, mapOrElse } from 'option-t/cjs/PlainResult'

export type { Result }

export function unwrapOrThrowRawErr<T>(val: Result<T, Error>): T {
  return mapOrElse(
    val,
    (err) => {
      throw err
    },
    (ok) => ok
  )
}
