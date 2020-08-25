import { NextApiHandler } from 'next'
import http from 'http-status-codes'
import { client } from '../../lib/shopify'
import { capture } from '../../lib/bugTrack'

const handler: NextApiHandler = async (req, res) => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string
  const ok = client.verifyMessage({
    hmac,
    ...req.body,
  })
  if (!ok) {
    capture(
      new Error(
        `Unauthorized request happened. expected=${hmac} got=${req.body}`
      )
    )
    res.status(http.UNAUTHORIZED)
    res.json({})
    return
  }
  // NOTE: This app doesn't store any customer's data, so we don't have to do anything.
  res.json({})
}

export default handler
