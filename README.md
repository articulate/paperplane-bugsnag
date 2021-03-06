<h1 align="center">
  paperplane-bugsnag
</h1>
<p align="center">
  A <a href="https://github.com/bugsnag/bugsnag-node"><code>bugsnag</code></a> wrapper for <a href="https://github.com/articulate/paperplane"><code>paperplane</code></a>.
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/paperplane-bugsnag"><img src="https://img.shields.io/npm/v/paperplane-bugsnag.svg" alt="npm version" style="max-width:100%;"></a> <a href="https://www.npmjs.com/package/paperplane-bugsnag"><img src="https://img.shields.io/npm/dm/paperplane-bugsnag.svg" alt="npm downloads" style="max-width:100%;"></a> <a href="https://travis-ci.org/articulate/paperplane-bugsnag"><img src="https://travis-ci.org/articulate/paperplane-bugsnag.svg?branch=master" alt="Build Status" style="max-width:100%;"></a> <a href='https://coveralls.io/github/articulate/paperplane-bugsnag?branch=v2'><img src='https://coveralls.io/repos/github/articulate/paperplane-bugsnag/badge.svg?branch=v2' alt='Coverage Status' /></a>
</p>

<p align="center">
  Filters `Boom` client errors (4xx) and `Joi` validation errors by default, and adds request data to the error notification for debugging.
</p>

## Usage

Setup your `bugsnag` like this:

```js
// server/lib/bugsnag.js

const bugsnag = require('bugsnag')

const bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_API_KEY,
  notifyReleaseStages: ['prod', 'stage'],
  releaseStage: process.env.SERVICE_ENV
})

const optionalCustomLogger =
  err => console.error(`My custom logged error: ${err.message}`)

module.exports = require('paperplane-bugsnag')(bugsnagClient, optionalCustomLogger)
```

Then use it as the `cry` option in `paperplane` like this:

```js
// server/index.js

const http = require('http')
const { mount } = require('paperplane')

const app = require('./rest')
const cry = require('./lib/bugsnag').notify

http.createServer(mount({ app, cry })).listen(3000, cry)
```

By default, `Boom` client errors (4xx) and `Joi` validitation errors will be ignored.

```js
// server/rest.js
module.exports = req => {
  const err = Boom.badRequest()
  return Promise.reject(err) // does not send notification
}
```

We can force a notification by setting `cry=true` on the error.

```js
// server/rest.js
module.exports = req => {
  const err = Boom.badRequest()
  err.cry = true
  return Promise.reject(err) // sends notification
}
```
