const paperplane = require('paperplane')

const {
  always, anyPass, complement, either, evolve, gt,
  is, mergeDeepRight, pathSatisfies, prop,
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
  either(
    prop('cry'),
    complement(anyPass([ clientError, isJoi ]))
  )

const redacted =
  always('REDACTED')

const redactHeaders =
  evolve({ authorization: redacted, cookie: redacted })

const isJsError = is(Error)

const setup = (bugsnagClient, logger = paperplane.logger) => {
  const notify = (err, opts = {}) => {
    if (isJsError(err)) {
      logger(err)

      const { req } = err
      const metaData = {}
      if (req) {
        metaData.request = formatRequest(req)
        delete err.req
      }

      if (notifiable(err)) {
        const options = mergeDeepRight({ metaData }, opts)
        bugsnagClient.notify(err, options)
      }
    }
  }

  return {
    notify,
  }
}

module.exports = setup
