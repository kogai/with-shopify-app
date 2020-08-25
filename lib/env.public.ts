import getConfig from 'next/config'

const { publicRuntimeConfig } = getConfig()

export const clientID: string = publicRuntimeConfig.shopify.apiKey
export const appURL: string = publicRuntimeConfig.shopify.appURL
export const sentryDNS: string = publicRuntimeConfig.sentry.dns
export const sentryEnabled: boolean = publicRuntimeConfig.sentry.enabled
