import { decodeVerifyPayload, decodeIndexQuery } from './decode'

describe('lib/shopify/decode', () => {
  describe('decodeVerifyPayload', () => {
    const standardPayload = {
      hmac: 'abc',
      code: 'def',
      shop: 'ghi',
      state: 'jkl',
      timestamp: 'mno',
      a: 'pqr',
    }

    ;[
      {
        title: 'ok',
        input: {
          ...standardPayload,
        },
      },
      {
        title: 'ng(bound property)',
        input: {
          ...standardPayload,
          code: ['ABC', 'DEF'],
        },
      },
      {
        title: 'ng(free property)',
        input: {
          ...standardPayload,
          a: ['ABC', 'DEF'],
        },
      },
    ].forEach(({ title, input }) => {
      it(title, () => {
        expect(decodeVerifyPayload(input)).toMatchSnapshot()
      })
    })
  })

  describe('decodeIndexQuery', () => {
    ;[
      {
        title: 'ok(pre)',
        input: {
          shop: 'mytest.myshopify.com',
        },
      },
      {
        title: 'ok(post)',
        input: {
          shop: 'mytest.myshopify.com',
          accessToken: 'abc',
          storeFrontAccessToken: 'def',
        },
      },
      {
        title: 'ng',
        input: {},
      },
      {
        title: 'ng(bound property)',
        input: {
          shop: ['mytest1.myshopify.com', 'mytest2.myshopify.com'],
        },
      },
    ].forEach(({ title, input }) => {
      it(title, () => {
        expect(decodeIndexQuery(input)).toMatchSnapshot()
      })
    })
  })
})
