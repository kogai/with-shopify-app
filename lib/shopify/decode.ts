import { NextApiRequest, GetServerSidePropsContext } from 'next'
import querystring from 'querystring'
import { VerifyPayload } from './client'
import { createErr, createOk, Result } from '../result'

export const decodeVerifyPayload = ({
  hmac,
  code,
  shop,
  state,
  timestamp,
  ...rest
}: NextApiRequest['query']): Result<VerifyPayload, Error> => {
  if (
    typeof hmac !== 'string' ||
    typeof code !== 'string' ||
    typeof shop !== 'string' ||
    typeof state !== 'string' ||
    typeof timestamp !== 'string' ||
    Object.values(rest).some((x) => typeof x !== 'string')
  ) {
    return createErr(
      new Error(
        `invalid property, ${querystring.stringify({
          hmac,
          code,
          shop,
          state,
          timestamp,
          ...rest,
        })}`
      )
    )
  }

  return createOk({
    hmac,
    code,
    shop,
    state,
    timestamp,
    ...rest,
  })
}

type ParsedUrlQuery = GetServerSidePropsContext['query']

type IndexQuery =
  | {
      type: 'pre'
      shop: string
    }
  | {
      type: 'post'
      accessToken: string
      storeFrontAccessToken: string
      shop: string
    }

export const decodeIndexQuery = (
  query: ParsedUrlQuery
): Result<IndexQuery, Error> => {
  const { shop, accessToken, storeFrontAccessToken } = query
  if (typeof shop !== 'string') {
    return createErr(new Error(`Invalid access. shop=${shop}`))
  }
  if (
    typeof accessToken === 'string' &&
    typeof storeFrontAccessToken === 'string'
  ) {
    return createOk({
      type: 'post',
      shop,
      storeFrontAccessToken,
      accessToken,
    })
  }
  return createOk({
    type: 'pre',
    shop,
  })
}
