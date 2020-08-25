import fs from 'fs'
import crypto from 'crypto'
import nock from 'nock'
import querystring from 'querystring'
import { createClient } from './client'

// NOTE: Test helper that produce hmac signed string.
const signHmac = () =>
  crypto
    .createHmac('sha256', 'test_api_secret')
    .update(
      querystring.stringify({
        code: '035fa8d75e6c5628d2406f5918e81529',
        shop: 'mytest.myshopify.com',
        state: '4d358df9cfa5826d1ac8cc8b9ffc18ca',
        timestamp: '1592874758',
      })
    )
    .digest('hex')

describe('lib/shopify/client', () => {
  beforeAll(() => nock.disableNetConnect())
  afterEach(() => nock.cleanAll())

  const client = createClient({
    version: '2099-00',
    clientID: 'test_api_key',
    clientSecret: 'test_api_secret',
    appURL: 'https://example.com',
    scope: 'administration',
  })

  describe('verify message', () => {
    it('signHmac utility', () => {
      expect(signHmac()).toBe(
        '42cca3f99694a606fcd0cb1269c804d723828f5d6abef2eece1bef9e02a11d96'
      )
    })
    ;[
      {
        title: 'ok',
        hmac:
          '42cca3f99694a606fcd0cb1269c804d723828f5d6abef2eece1bef9e02a11d96',
        expected: true,
      },
      {
        title: 'ng',
        hmac:
          'aaaca3f99694a606fcd0cb1269c804d723828f5d6abef2eece1bef9e02a11d96',
        expected: false,
      },
    ].forEach(({ title, hmac, expected }) => {
      it(title, () => {
        const ok = client.verifyMessage({
          hmac,
          code: '035fa8d75e6c5628d2406f5918e81529',
          shop: 'mytest.myshopify.com',
          state: '4d358df9cfa5826d1ac8cc8b9ffc18ca',
          timestamp: '1592874758',
        })
        expect(ok).toBe(expected)
      })
    })
  })

  describe('access-token', () => {
    it('ok', async () => {
      nock('https://mytest.myshopify.com', {
        reqheaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '90',
        },
      })
        .post(
          '/admin/oauth/access_token',
          'code=035fa8d75e6c5628d2406f5918e81529&client_id=test_api_key&client_secret=test_api_secret'
        )
        .reply(200, {
          access_token: 'abc',
        })
      const result = await client.accessTokenCreate({
        code: '035fa8d75e6c5628d2406f5918e81529',
        shop: 'mytest.myshopify.com',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "ok": true,
          "val": Object {
            "access_token": "abc",
          },
        }
      `)
    })

    it('ng', async () => {
      nock('https://mytest.myshopify.com', {
        reqheaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '90',
        },
      })
        .post(
          '/admin/oauth/access_token',
          'code=035fa8d75e6c5628d2406f5918e81529&client_id=test_api_key&client_secret=test_api_secret'
        )
        .reply(500, {
          message: 'internal server error',
        })
      const result = await client.accessTokenCreate({
        code: '035fa8d75e6c5628d2406f5918e81529',
        shop: 'mytest.myshopify.com',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": [Error: {"message":"internal server error"}],
          "ok": false,
          "val": undefined,
        }
      `)
    })
  })

  describe('storefront-access-token', () => {
    it('ok', async () => {
      nock('https://mytest.myshopify.com', {
        reqheaders: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': 'abc',
        },
      })
        .post(
          '/admin/api/2099-00/storefront_access_tokens.json',
          JSON.stringify({
            storefront_access_token: {
              title: 'label-of-token',
            },
          })
        )
        .reply(200, {
          storefront_access_token: {
            access_token: 'def',
          },
        })
      const result = await client.storefrontAccessToken({
        accessToken: 'abc',
        title: 'label-of-token',
        shop: 'mytest.myshopify.com',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "ok": true,
          "val": Object {
            "storefront_access_token": Object {
              "access_token": "def",
            },
          },
        }
      `)
    })

    it('ng', async () => {
      nock('https://mytest.myshopify.com', {
        reqheaders: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': 'abc',
        },
      })
        .post(
          '/admin/api/2099-00/storefront_access_tokens.json',
          JSON.stringify({
            storefront_access_token: {
              title: 'label-of-token',
            },
          })
        )
        .reply(500, {
          message: 'internal server error',
        })
      const result = await client.storefrontAccessToken({
        accessToken: 'abc',
        title: 'label-of-token',
        shop: 'mytest.myshopify.com',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": [Error: {"message":"internal server error"}],
          "ok": false,
          "val": undefined,
        }
      `)
    })
  })

  describe('authorization URL', () => {
    it('ok', async () => {
      const result = client.authorizationURL({
        shop: 'mytest.myshopify.com',
        state: 'abc',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "ok": true,
          "val": "https://mytest.myshopify.com/admin/oauth/authorize?client_id=test_api_key&redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fdone&scope=administration&state=abc",
        }
      `)
    })

    it('ng', async () => {
      const result = client.authorizationURL({
        shop: 'mytest.bigcommerce.com',
        state: 'abc',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": [Error: invalid shop name],
          "ok": false,
          "val": undefined,
        }
      `)
    })

    it('strip uselss slash', async () => {
      const client = createClient({
        version: '2099-00',
        clientID: 'test_api_key',
        clientSecret: 'test_api_secret',
        appURL: 'https://example.com/',
        scope: 'administration',
      })
      const result = client.authorizationURL({
        shop: 'mytest.myshopify.com',
        state: 'abc',
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "err": undefined,
          "ok": true,
          "val": "https://mytest.myshopify.com/admin/oauth/authorize?client_id=test_api_key&redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fdone&scope=administration&state=abc",
        }
      `)
    })
  })

  describe('app ifram url', () => {
    ;[
      {
        title: 'ok',
        statusCode: 200,
        response: {
          data: {
            app: {
              handle: 'myapp',
            },
          },
        },
      },
      {
        title: 'ng(json)',
        statusCode: 500,
        response: {
          message: 'internal server error',
        },
      },
      {
        title: 'ng(text)',
        statusCode: 500,
        response: 'internal server error',
      },
    ].forEach(({ title, statusCode, response }) => {
      it(title, async () => {
        nock('https://mytest.myshopify.com', {
          reqheaders: {
            'content-type': 'application/json',
            'x-shopify-access-token': 'abc',
          },
        })
          .post(
            '/admin/api/2099-00/graphql.json',
            JSON.stringify({
              query: fs.readFileSync('./lib/shopify/appHandle.gql').toString(),
            })
          )
          .reply(statusCode, response)

        const result = await client.appIframeURL({
          accessToken: 'abc',
          shop: 'mytest.myshopify.com',
        })
        expect(result).toMatchSnapshot()
      })
    })
  })
})
