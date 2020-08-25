import querystring from 'querystring'
import crypto from 'crypto'
import safeCompare from 'safe-compare'
import fetch from 'isomorphic-fetch'
import { GraphQLClient } from 'graphql-request'
import { getSdk } from './admin-api' // THIS FILE IS THE GENERATED FILE
import { Result, createOk, createErr } from '../result'

type Config = {
  clientSecret: string
  clientID: string
  version: string
  appURL: string
  scope: string
}

export type VerifyPayload = {
  hmac: string
  [key: string]: string
}

export type AccessTokenPayload = {
  code: string
  shop: string
}

export type AccessTokenResponse = {
  access_token: string
}

export type StorefrontAccessTokenPayload = {
  accessToken: string
  shop: string
  title: string
}

export type StorefrontAccessTokenResponse = {
  storefront_access_token: {
    access_token: string
  }
}

export type AuthorizationURLResponse = {
  shop: string
  state: string
}

export type AppIframeURLResponse = {
  accessToken: string
  shop: string
}

interface ShopifyClient {
  authorizationURL(payload: AuthorizationURLResponse): Result<string, Error>
  appIframeURL(payload: AppIframeURLResponse): Promise<Result<string, Error>>
  verifyMessage(payload: VerifyPayload): boolean
  accessTokenCreate(
    payload: AccessTokenPayload
  ): Promise<Result<AccessTokenResponse, Error>>
  storefrontAccessToken(
    payload: StorefrontAccessTokenPayload
  ): Promise<Result<StorefrontAccessTokenResponse, Error>>
}

const verifyMessage = (config: Config): ShopifyClient['verifyMessage'] => ({
  hmac,
  ...rest
}) => {
  const orderedMap = Object.keys(rest)
    .sort((value1, value2) => value1.localeCompare(value2))
    .reduce((accum, key) => {
      accum[key] = rest[key]
      return accum
    }, {} as VerifyPayload)
  const message = querystring.stringify(orderedMap)

  const generatedHash = crypto
    .createHmac('sha256', config.clientSecret)
    .update(message)
    .digest('hex')

  return safeCompare(generatedHash, hmac)
}

const accessTokenCreate = ({
  clientID,
  clientSecret,
}: Config): ShopifyClient['accessTokenCreate'] => async ({ code, shop }) => {
  const body = querystring.stringify({
    code,
    client_id: clientID,
    client_secret: clientSecret,
  })
  // NOTE: OAuth API is unversioned.
  // See https://shopify.dev/concepts/about-apis/versioning
  const accessTokenRes = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body: body,
    }
  )
  if (!accessTokenRes.ok) {
    const err = await accessTokenRes.text()
    return createErr(new Error(err))
  }
  return createOk(await accessTokenRes.json())
}

const storefrontAccessToken = ({
  version,
}: Config): ShopifyClient['storefrontAccessToken'] => async ({
  title,
  shop,
  accessToken,
}) => {
  const storeFrontAccessTokenRes = await fetch(
    `https://${shop}/admin/api/${version}/storefront_access_tokens.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        storefront_access_token: {
          title,
        },
      }),
    }
  )
  if (!storeFrontAccessTokenRes.ok) {
    const err = await storeFrontAccessTokenRes.text()
    return createErr(new Error(err))
  }
  return createOk(await storeFrontAccessTokenRes.json())
}

const authorizationURL = ({
  appURL,
  clientID,
  scope,
}: Config): ShopifyClient['authorizationURL'] => ({ shop, state }) => {
  const DEFAULT_MYSHOPIFY_DOMAIN = 'myshopify.com'
  const shopRegex = new RegExp(
    `^[a-z0-9][a-z0-9\\-]*[a-z0-9]\\.${DEFAULT_MYSHOPIFY_DOMAIN}$`,
    'i'
  )
  if (!shopRegex.test(shop)) {
    return createErr(new Error('invalid shop name'))
  }
  const message = querystring.stringify({
    client_id: clientID,
    redirect_uri: `${appURL}/api/done`,
    scope,
    state,
  })
  return createOk(`https://${shop}/admin/oauth/authorize?${message}`)
}

const appIframeURL = ({
  version,
}: Config): ShopifyClient['appIframeURL'] => async ({ shop, accessToken }) => {
  const client = new GraphQLClient(
    `https://${shop}/admin/api/${version}/graphql.json`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    }
  )
  try {
    const { app } = await getSdk(client).appHandle()
    if (app?.handle == null) {
      return createErr(new Error(`Expected value cant get. ${app}`))
    }
    return createOk(`https://${shop}/admin/apps/${app.handle}`)
  } catch (error) {
    return createErr(error)
  }
}

export const createClient = (config_: Config): ShopifyClient => {
  const appURL = /\/$/.test(config_.appURL)
    ? config_.appURL.substring(0, config_.appURL.length - 1)
    : config_.appURL
  const config = {
    ...config_,
    appURL,
  }
  return {
    verifyMessage: verifyMessage(config),
    accessTokenCreate: accessTokenCreate(config),
    storefrontAccessToken: storefrontAccessToken(config),
    authorizationURL: authorizationURL(config),
    appIframeURL: appIframeURL(config),
  }
}
