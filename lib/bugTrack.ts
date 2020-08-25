import * as Sentry from '@sentry/node'
import { LogLevel } from '@sentry/types'
import { sentryDNS, sentryEnabled } from './env.public'

export const setup = () => {
  Sentry.init({
    enabled: sentryEnabled,
    dsn: sentryDNS,
    logLevel: LogLevel.Debug,
  })
}

export const capture = (err: Error) => {
  Sentry.captureException(err)
}

export const teardown = async (): Promise<void> => {
  await Sentry.flush(2000)
}
