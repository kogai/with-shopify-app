import { clientSecret } from '../../lib/env.secret'
import { clientID, appURL } from '../../lib/env.public'
import { createClient } from './client'

export * from './decode'
export const client = createClient({
  clientSecret,
  clientID,
  appURL,
  version: '2020-07',
  scope: [
    'unauthenticated_read_product_listings',
    'unauthenticated_read_product_tags',
    'unauthenticated_write_checkouts',
    'unauthenticated_write_customers',
    'unauthenticated_read_customer_tags',
    'unauthenticated_read_content',
  ].join(','),
})
