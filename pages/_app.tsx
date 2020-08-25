import React from 'react'
import App from 'next/app'
import * as BugTrack from '../lib/bugTrack'

BugTrack.setup()

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    // Workaround for https://github.com/vercel/next.js/issues/8592
    return <Component {...pageProps} />
  }
}
