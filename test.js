const Boom = require('boom')
const { expect } = require('chai')
const spy = require('@articulate/spy')

const logger = require('paperplane').logger = spy()

const setup = require('.')

const FakeBugsnag = notified => {
  const befores = []

  const onBeforeNotify = befores.push.bind(befores)

  const notify = err => {
    const notification = { events: [{ metaData: {} }] }
    let dontNotify
    befores.forEach(cb => {
      const ret = cb(notification, err)
      if (ret === false) dontNotify = true
    })
    if (!dontNotify) notified(notification)
  }

  return { onBeforeNotify, notify }
}

describe('paperplane-bugsnag + bugsnag.notify', () => {
  let bugsnag
  const notified = spy()

  beforeEach(() => {
    bugsnag = FakeBugsnag(notified)
    setup(bugsnag)
  })

  afterEach(() => {
    logger.reset()
    notified.reset()
  })

  describe('when no Error', () => {
    beforeEach(() =>
      bugsnag.notify('not an error')
    )

    it('does not log', () =>
      expect(logger.calls.length).to.equal(0)
    )

    it('does not notify', () =>
      expect(notified.calls.length).to.equal(0)
    )
  })

  describe('when Booms with client error (4xx)', () => {
    const err = Boom.notFound()

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(logger.calls.length).to.equal(1)
      expect(logger.calls[0]).to.eql([ err ])
    })

    it('does not notify', () =>
      expect(notified.calls.length).to.equal(0)
    )
  })

  describe('when Booms with server error (5xx)', () => {
    const err = Boom.badImplementation()

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(logger.calls.length).to.equal(1)
      expect(logger.calls[0]).to.eql([ err ])
    })

    it('notifies', () =>
      expect(notified.calls.length).to.equal(1)
    )
  })

  describe('when Joi error', () => {
    const err = new Error('joi boi')
    err.isJoi = true

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(logger.calls.length).to.equal(1)
      expect(logger.calls[0]).to.eql([ err ])
    })

    it('does not notify', () =>
      expect(notified.calls.length).to.equal(0)
    )
  })

  describe('when used as cry for paperplane', () => {
    const err = Boom.badImplementation()

    err.req = {
      headers: {
        authorization: 'Bearer abc123',
        cookie: 'nom nom nom nom',
        host: 'paperplane-bugsnag.zone'
      },
      method: 'GET',
      pathname: '/api/users',
      protocol: 'https',
      query: { id: 'guy' },
      url: '/api/users?id=guy'
    }

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(logger.calls.length).to.equal(1)
      expect(logger.calls[0]).to.eql([ err ])
    })

    it('includes the request data in the notification', () => {
      expect(notified.calls.length).to.equal(1)
      expect(notified.calls[0]).to.eql([{
        events: [{
          metaData: {
            request: {
              headers: {
                authorization: 'REDACTED',
                cookie: 'REDACTED',
                host: 'paperplane-bugsnag.zone'
              },
              httpMethod: 'GET',
              path: '/api/users',
              query: { id: 'guy' },
              url: 'https://paperplane-bugsnag.zone/api/users?id=guy'
            }
          }
        }]
      }])
    })
  })
})
