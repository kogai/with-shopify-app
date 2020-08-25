import { createNone, createSome, Option } from 'option-t/cjs/PlainOption'

export function fromNullable<T>(v: T | null | undefined): Option<T> {
  return v === undefined || v === null ? createNone() : createSome<T>(v)
}
