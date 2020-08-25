import { NextApiRequest, NextApiResponse } from 'next'
import http from 'http-status-codes'
import { appURL } from '../../lib/env.public'
import { client, decodeVerifyPayload } from '../../lib/shopify'
import { unwrap } from '../../lib/result'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { code, hmac, shop, state: nonce } = req.query
  const payloadMaybe = decodeVerifyPayload({
    code,
    hmac,
    shop,
    state: nonce,
    ...req.query,
  })
  // TODO: Use pattern match like payload.mapOrElse(err => {}, ok => {})
  // TODO: Use helper function which modificates Result<_, Error> to json
  if (!payloadMaybe.ok) {
    res.status(http.BAD_REQUEST)
    res.json(payloadMaybe)
    return
  }
  const payload = unwrap(payloadMaybe)
  const ok = client.verifyMessage(payload)
  if (!ok) {
    res.status(http.BAD_REQUEST)
    res.json({
      message: `Invalid hmac expected=[${payload.hmac}] got=[${payload}]`,
    })
    return
  }

  if (req.cookies.nonce !== nonce) {
    res.status(http.BAD_REQUEST)
    res.json({
      message: `Invalid nonce expected=[${req.cookies.nonce}] got=[${nonce}]`,
    })
    return
  }

  const accessTokenMaybe = await client.accessTokenCreate({
    code: payload.code,
    shop: payload.shop,
  })
  if (!accessTokenMaybe.ok) {
    res.status(http.BAD_REQUEST)
    res.json(accessTokenMaybe)
    return
  }
  const accessToken = unwrap(accessTokenMaybe)
  const storefrontAccessTokenMaybe = await client.storefrontAccessToken({
    title: 'shopify-storefront-api-explorer',
    accessToken: accessToken.access_token,
    shop: payload.shop,
  })
  if (!storefrontAccessTokenMaybe.ok) {
    res.status(http.BAD_REQUEST)
    res.json(storefrontAccessTokenMaybe)
    return
  }
  const storefrontAccessToken = unwrap(storefrontAccessTokenMaybe)

  // TODO: Notify when current plan isn't partner_test

  const queries = [
    `accessToken=${accessToken.access_token}`,
    `storeFrontAccessToken=${storefrontAccessToken.storefront_access_token.access_token}`,
    `shop=${shop}`,
  ].join('&')

  res.redirect(`${appURL}?${queries}`)
}

export default handler
