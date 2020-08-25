import { unwrapOrThrowRawErr, unwrap, createOk, createErr } from './result'

describe('lib/result', () => {
  it('ok', () => {
    const result = unwrapOrThrowRawErr(createOk(1))
    expect(result).toMatchInlineSnapshot(`1`)
  })

  it('ng', () => {
    expect(() => {
      unwrapOrThrowRawErr(createErr(new Error('something wrong')))
    }).toThrowErrorMatchingInlineSnapshot(`"something wrong"`)
  })

  it('ng(lib)', () => {
    expect(() => {
      unwrap(createErr(new Error('something wrong')))
    }).toThrowErrorMatchingInlineSnapshot(`"called with \`Err\`"`)
  })
})
