const { logger } = require('paperplane')

const {
  always, anyPass, complement, compose, evolve, flip, gt,
  is, merge, pathSatisfies, prop, tap, when
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

const setup = (bugsnag, opts) => {
  const bugsnagClient = bugsnag(merge({
    beforeSend: report => {
      if (!notifiable(report)) {
        report.ignore()
      }

      // somehow add the request, if present
      console.log({ report, addR: addRequest(report) })

      // check if report is an Error, if so pass to logger
      // bugsnag.notify =
      //   when(is(Error), compose(bugsnag.notify, tap(logger)))
      if (is(Error, report)) {
        logger(report)
      }

      return report
    }
  }, opts))


  return bugsnagClient
}

module.exports = setup
