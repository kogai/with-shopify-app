const SentryWebpackPlugin = require('@sentry/webpack-plugin')

module.exports = {
  webpack: (config, { isServer }) => {
    // NOTE: Workaround for https://github.com/getsentry/sentry-javascript/issues/2378
    if (!isServer) {
      config.resolve.alias['@sentry/node'] = '@sentry/browser'
    }

    return {
      ...config,
      plugins: config.plugins.concat(
        process.env.VERCEL_GITHUB_COMMIT_SHA == null
          ? []
          : [
              new SentryWebpackPlugin({
                include: '.next',
                ignore: ['node_modules', '.vscode'],
                urlPrefix: '~/_next',
                release: process.env.VERCEL_GITHUB_COMMIT_SHA,
              }),
            ]
      ),
    }
  },
  // TODO: Separate settings for each stages.
  serverRuntimeConfig: {
    shopify: {
      apiSecret: process.env.SHOPIFY_API_SECRET,
    },
  },
  publicRuntimeConfig: {
    shopify: {
      apiKey: process.env.SHOPIFY_API_KEY,
      appURL:
        process.env.VERCEL_GITHUB_REPO == null ||
        process.env.VERCEL_GITHUB_COMMIT_REF == null ||
        process.env.VERCEL_GITHUB_ORG == null
          ? 'http://localhost:3000'
          : `https://${process.env.VERCEL_GITHUB_REPO}-git-${process.env.VERCEL_GITHUB_COMMIT_REF}.${process.env.VERCEL_GITHUB_ORG}.vercel.app`,
    },
    sentry: {
      dns: process.env.SENTRY_DNS,
      enabled: process.env.VERCEL_GITHUB_COMMIT_REF === 'master',
    },
  },
  experimental: {
    documentMiddleware: true,
  },
}
