const Boom = require('boom')
const { expect } = require('chai')
const spy = require('@articulate/spy')

const mockLogger = require('paperplane').logger = spy()
const setup = require('.')

describe('paperplane-bugsnag + bugsnag.notify', () => {
  let bugsnag
  const mockNotify = spy()

  const mockBugsnagClient = {
    notify: mockNotify,
  }

  beforeEach(() => {
    bugsnag = setup(mockBugsnagClient)
  })

  afterEach(() => {
    mockLogger.reset()
    mockNotify.reset()
  })

  describe('when no Error', () => {
    beforeEach(() =>
      bugsnag.notify('not an error')
    )

    it('does not log', () =>
      expect(mockLogger.calls.length).to.equal(0)
    )

    it('does not notify', () =>
      expect(mockNotify.calls.length).to.equal(0)
    )
  })

  describe('when Booms with client error (4xx)', () => {
    const err = Boom.notFound()

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(mockLogger.calls.length).to.equal(1)
      expect(mockLogger.calls[0]).to.eql([ err ])
    })

    it('does not notify', () =>
      expect(mockNotify.calls.length).to.equal(0)
    )
  })

  describe('when Booms with server error (5xx)', () => {
    const err = Boom.badImplementation()

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(mockLogger.calls.length).to.equal(1)
      expect(mockLogger.calls[0]).to.eql([ err ])
    })

    it('notifies', () =>
      expect(mockNotify.calls.length).to.equal(1)
    )
  })

  describe('when Joi error', () => {
    const err = new Error('joi boi')
    err.isJoi = true

    beforeEach(() =>
      bugsnag.notify(err)
    )

    it('logs', () => {
      expect(mockLogger.calls.length).to.equal(1)
      expect(mockLogger.calls[0]).to.eql([ err ])
    })

    it('does not notify', () =>
      expect(mockNotify.calls.length).to.equal(0)
    )
  })

  describe('when used as cry for paperplane', () => {
    const err = Boom.badImplementation()

    beforeEach(() => {
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
      bugsnag.notify(err)
    })

    it('logs', () => {
      expect(mockLogger.calls.length).to.equal(1)
      expect(mockLogger.calls[0]).to.eql([ err ])
    })

    it('includes the request data in the notification', () => {
      expect(mockNotify.calls.length).to.equal(1)
      expect(mockNotify.calls[0]).to.deep.eql([
        err,
        {
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
        }
      ])
    })
  })
})
