import React from 'react'
import { NextPage, GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import crypto from 'crypto'
import { client, decodeIndexQuery } from '../lib/shopify'
import { unwrapOrThrowRawErr } from '../lib/result'

type Props =
  | {
      type: 'pre'
      state: string
      authorizationURL: string
    }
  | {
      type: 'post'
      storeFrontAccessToken: string
      shop: string
      appIframeURL: string
    }

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const params = unwrapOrThrowRawErr(decodeIndexQuery(context.query))
  const state = crypto.randomBytes(32).toString('hex')
  return {
    props:
      params.type === 'pre'
        ? {
            type: 'pre',
            authorizationURL: unwrapOrThrowRawErr(
              client.authorizationURL({
                shop: params.shop,
                state,
              })
            ),
            state,
          }
        : {
            type: 'post',
            storeFrontAccessToken: params.storeFrontAccessToken,
            shop: params.shop,
            appIframeURL: unwrapOrThrowRawErr(
              await client.appIframeURL({
                accessToken: params.accessToken,
                shop: params.shop,
              })
            ),
          },
  }
}

export const Home: NextPage<InferGetServerSidePropsType<
  typeof getServerSideProps
>> = (props) => {
  React.useEffect(() => {
    if (props.type === 'pre') {
      document.cookie = `nonce=${props.state}`
      window.location.href = props.authorizationURL
    }
    if (props.type === 'post') {
      if (
        // Not inside of iframe
        window.self == window.top &&
        // NOTE: Make dev easily
        location.host !== 'localhost:3000'
      ) {
        window.location.href = props.appIframeURL
      }
    }
  }, [props.type])

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main>{props.type === 'pre' ? 'Loading...' : 'App installed.'}</main>

      <style jsx>{`
        main {
          height: 100vh;
        }
      `}</style>
    </>
  )
}

export default Home
