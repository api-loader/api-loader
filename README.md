# API Loader
> Easy API endpoint management

Getting started
---------------

```javascript
const express = require('express')
const api = require('api-loader')
const app = express()

// ...

await api(app)

// ./api/v1/route/get.js => GET api/v1/route
// ./api/v1/route/post.js => POST api/v1/route

// ...
 

```

# Configuration

### programmatic

```javascript
const { config } = api

config({
  loader: 'express', // optional
  paths: [
    'path/to/routes',
    {
      path: 'path/to/other/routes',
      prefix: 'v1' // optional
    }
  ],
  adapter: 'path/to/adapter', // optional
  route: 'path/to/route' // optional
})

```

All paths passed to the config is relative to your project working directory.

#### loader (String)

Optional param that defines the server type (default: express). <br/>
Can be used as path to your own loader module. <br/>
More built-in loaders to come (e.g. koa, hapi, ...)

#### paths (String | Object | Array)

Paths to directories containing your endpoints as a String, an Object with a path property or an Array containing any of the two. <br />
<br />
Each path object will be passed as a param of the Route class when loading their endpoints.
<br />
<br />
A prefix property can be used to prepend each endpoint path.

#### adapter (String)

Path to a custom function, Object or class. An adapter defines how a Route object is mounted on the server (can be used in place of custom loader).

```javascript
module.exports = (server, route) => { /* ... */ }

// OR

module.exports = {
  before: (server, defaults, options) => { // optional
    /* ... */
  },
  handler: (server, route) => {
    /* ... */
  },
  after: (server, defaults, options) => { // optional
    /* ... */
  }
}

// OR

module.exports = class CustomAdapter extends Adapter {
  before (server, defaults, options) { /* ... */ }

  handler (server, route) { /* ... */ }

  after (server, defaults, options) { /* ... */ }
}
```

As an Object or a class, before is called prior loading any route (if defined) while after is called post loading.
<br />
The two functions receive the default config you have set and the options you might have passed when loading your routes.

```javascript
await api(app, options)
```

#### route (String)

Path to a custom Route class

### .api-loader file

If provided as JSON, the .api-loader file will be loaded automatically as api-loader module is required. 

### package.json

If provided, the api-loader property of the package.json file will be automatically loaded as api-loader module is required. The .api-loader file has a higher priority.

### as module

The configuration can be auto-loaded from a module on startup using a config property in either the two previous cases:

```javascript
{
  config: 'path/to/configuration'
}
```

Then:
```javascript
module.exports = {
  /* your config in js */
}
```


# Endpoint

Endpoints are simple modules named after the method they address:
```javascript
// ./api/v1/anything/get.js

module.exports = {
  path: 'new', // optional
  handler: (request, response) => {
    /* ... */
  }
}

// with path
// => GET api/v1/anything/new

// without path
// => GET api/v1/anything
```

Folder names can be overridden using an index.js file (useful for url params):

```javascript
// ./api/v1/anything/index.js

module.exports = {
  path: 'something'
}

// will cause the example above to become
// => GET api/v1/something/new
```

An endpoint can override a folder name using ~ :

```javascript
// ./api/v1/anything/get.js

module.exports = {
  path: '~/brand/new',
  handler: (request, response) => {
    /* ... */
  }
}

// => GET api/v1/brand/new
```

An endpoint route can be set "statically" as follow:
```javascript
// ./api/v1/nested/route/with/a/twist/get.js

module.exports = {
  url: 'api/v1/boom',
  handler: (request, response) => {
    /* ... */
  }
}

// => GET api/v1/boom
// instead of
// => GET api/v1/nested/route/with/a/twist
```

# Adapter
```javascript
class Adapter {
  before (server, defaults, options) {
    /* ... */
  }

  handler (server, route) {
    /* ... */
  }

  after (server, defaults, options) {
    /* ... */
  }
}
```
# Route

```javascript
class Route {
  constructor ({
    adapter,
    key,
    filepath,
    prefix,
    endpoint,
    parent,
    method,
    settings
  }) {
    /* ... */
  }
}
```

Roadmap
=======

In progress
-----------
- implement Router (per defined path)
- Adapter and Route documentation
- swagger generated API documentation

Planned
-------
- rest file

```javascript
// ./api/v1/anything/rest.js

module.exports = {
  index (params) { // GET api/v1/anything

  },
  get (id, params) { // GET api/v1/anything/:id

  },
  post (id, data, params) { // POST api/v1/anything/:id

  },
  put (id, data, params) { // PUT api/v1/anything/:id

  },
  patch (id, data, params) { // PATCH api/v1/anything/:id

  },
  delete (id, data, params) { // DELETE api/v1/anything/:id

  },
  procedure (id, data, params) { // POST api/v1/anything/:id/procedure

  }
}
```
