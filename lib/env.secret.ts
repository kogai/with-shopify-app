import getConfig from 'next/config'

const { serverRuntimeConfig } = getConfig()

export const clientSecret: string = serverRuntimeConfig.shopify.apiSecret
