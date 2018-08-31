const { logger } = require('paperplane')

const {
  always, anyPass, complement, compose, evolve, flip, gt,
  is, pathSatisfies, prop, tap, when
} = require('ramda')

const addRequest = (notification, { req }) => {
  if (req) notification.events[0].metaData.request = formatRequest(req)
}

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
  flip(complement(anyPass([ clientError, isJoi ])))

const redacted =
  always('REDACTED')

const redactHeaders =
  evolve({ authorization: redacted, cookie: redacted })

const setup = bugsnag => {
  bugsnag.onBeforeNotify(notifiable)
  bugsnag.onBeforeNotify(addRequest)

  bugsnag.notify =
    when(is(Error), compose(bugsnag.notify, tap(logger)))

  return bugsnag
}

module.exports = setup
