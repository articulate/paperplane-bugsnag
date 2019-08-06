const { logger } = require('paperplane')

const {
  always, anyPass, complement, compose, evolve, gt,
  is, mergeDeepRight, pathSatisfies, prop, tap, when
} = require('ramda')

const clientError =
  pathSatisfies(gt(500), ['output', 'statusCode'])

const formatRequest = req => ({
  headers:    redactHeaders(req.headers),
  httpMethod: req.method,
  path:       req.pathname,
  query:      req.query,
  url:        req.protocol + '://' + req.headers.host + req.url
})

const isJoi =
  prop('isJoi')

const notifiable =
  complement(anyPass([ clientError, isJoi ]))

const redacted =
  always('REDACTED')

const redactHeaders =
  evolve({ authorization: redacted, cookie: redacted })

const setup = bugsnagClient => {
  const notify = (err, opts) => {
    const { req } = err

    const metaData = {}
    if (req) {
      metaData.request = formatRequest(req)
      delete err.req
    }

    if (notifiable(err)) {
      bugsnagClient.notify(err, mergeDeepRight(opts, { metaData }))
    }
  }

  return {
    notify: when(is(Error), compose(notify, tap(logger)))
  }
}

module.exports = setup
