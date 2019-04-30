const Path = require('path')
const fs = require('fs')
const {
  existsSync,
  readFileSync,
  access
} = fs

const { promisify } = require('util')

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const methods = require('./lib/methods')
const AsyncFunction = (async function () {}).constructor
const Route = require('./route')
const Adapter = require('./adapter')

const main = process.cwd()
const confFile = '.api-loader'
const confFilePath = Path.join(main, confFile)

const loaders = {
  express: './server/express'
}

let setup
let defaults = {}

async function api (server, opt = {}) {
  const options = Object.assign({}, defaults, opt)
  const { loader = 'express', paths, adapter: adaptr, endpoints = {}, route } = options

  let load
  let adapter
  let Adaptr
  let RouteClass

  if (!loader) {
    throw new Error('API Loader: loader is undefined')
  }
  else if (loader instanceof Function) {
    load = loader
  }
  else {
    load = (loader in loaders)
      ? require(loaders[ loader ])
      : require(loader)

    if (!(load instanceof Function)) throw new Error('API Loader: loader module must be a function')
  }

  if (typeof adaptr !== 'string') {
    Adaptr = adaptr
  }
  else {
    const adapterPath = Path.join(main, adaptr)
    const hasAdapter = await exists(adapterPath)

    Adaptr = hasAdapter
      ? require(adapterPath)
      : require(adaptr)
  }

  if (Adaptr) {
    if (!(Adaptr instanceof Function || Adaptr.handler instanceof Function)) {
      throw new Error('API Loader: adapter must be a function, Adapter class or an object with a handler function')
    }

    if (Adaptr instanceof Function && Adaptr.prototype instanceof Adapter) {
      adapter = new Adaptr()
    }
    else {
      adapter = Adaptr
    }

    if (adapter.before instanceof AsyncFunction) {
      await adapter.before(server, defaults, opt)
    }
    else if (adapter.before instanceof Function) {
      adapter.before(server, defaults, opt)
    }
  }

  if (!route) {
    RouteClass = Route
  }
  else {

    if (typeof route !== 'string') {
      RouteClass = route
    }
    else {
      const routePath = Path.join(main, route)
      const hasRoute = await exists(routePath)

      RouteClass = hasRoute
        ? require(routePath)
        : require(route)
    }

    if (!(RouteClass instanceof Function && RouteClass.prototype instanceof Route)) {
      throw new Error('API Loader: custom Route class must extend api-loader/Route')
    }
  }

  const entries = Array.isArray(paths)
    ? paths
    : paths
      ? [ paths ]
      : []

  const loading = entries.map(entry => {
    let src
    let prefix
    let settings

    if (!(entry instanceof Object)) {
      src = entry
      prefix = ''
      settings = { path: entry }
    }
    else {
      ({ path: src, prefix = '' } = entry)
      settings = entry
    }

    const path = Path.join(main, src)

    return collect({
      adapter,
      load,
      path,
      prefix,
      server,
      endpoints,
      Route: RouteClass,
      settings
    })
  })

  const routes = []
  const loaded = await Promise.all(loading)

  loaded.forEach(items => routes.push(...items))

  if (adapter) {
    if (adapter.after instanceof AsyncFunction) {
      await adapter.after(server, defaults, opt)
    }
    else if (adapter.after instanceof Function) {
      adapter.after(server, defaults, opt)
    }
  }

  return routes
}

function exists (filePath) {
  return new Promise(resolve => access(filePath, fs.constants.F_OK, err => resolve(err ? false : true)))
}

async function collect ({
  key = '',
  adapter,
  load,
  path,
  server,
  prefix,
  endpoints,
  parent,
  Route,
  settings
}) {
  const items = await readdir(path)

  const routes = []
  const matchers = Object.assign({}, endpoints, settings.endpoints)
  const keys = Object.keys(matchers)

  const indexFilePath = Path.join(path, 'index.js')
  const moduleFilePath = `${ path }.js`

  const [ hasIndex, hasModule ] = await Promise.all([
    exists(indexFilePath),
    exists(moduleFilePath)
  ])

  let index
  let routePath

  if (hasModule) {
    index = require(moduleFilePath)
    routePath = moduleFilePath
  }
  else if (hasIndex) {
    index = require(indexFilePath)
    routePath = indexFilePath
  }
  else {
    routePath = path
  }

  const root = new Route({
    key,
    adapter,
    filepath: routePath,
    endpoint: index,
    parent,
    prefix
  })

  const loaded = await Promise.all(items.map(async item => {
    const currentPath = Path.join(path, item)
    const st = await stat(currentPath)
    const routes = []


    if (st.isDirectory()) {
      return collect({
        key: item,
        adapter,
        endpoints,
        load,
        server,
        prefix,
        path: currentPath,
        parent: root,
        Route,
        settings
      })
    }

    // TODO: matchers
    let matched
    const filename = item.replace(/\.js$/, '').toLowerCase()
    const endpoint = require(currentPath)

    if (keys.length) {
      await keys.map(key => {
        const method = key.toLowerCase()

        if (!methods.includes(method)) return

        const conf = settings && settings.endpoints && settings.endpoints[ key ] ||  endpoints[ key ]
        let match

        if (typeof conf === 'string') {
          const lowerCased = conf.toLowerCase()

          if (filename === lowerCased) {
            match = conf
          }
        }
        else {
          let { name } = conf
          name = name || key
          const lowerCased = name && name.toLowerCase()

          if (filename === lowerCased) {
            match = name
          }
        }

        if (!match) return

        const route = new Route({
          adapter,
          key: root.key,
          filepath: currentPath,
          prefix,
          endpoint,
          parent: root,
          method,
          settings
        })

        matched = true

        routes.push(route)
        return load(server, route, adapter) // tmp adapter
      })
    }

    const loadable = !matched && !endpoints[ filename ] && methods.includes(filename)

    if (loadable) {
      const method = filename
      const route = new Route({
        adapter,
        key: root.key,
        filepath: currentPath,
        prefix,
        endpoint,
        parent: root,
        method,
        settings
      })

      routes.push(route)
      load(server, route, adapter)
    }

    return routes
  }))

  loaded.forEach(items => routes.push(...items))

  return routes
}

function config (settings) {
  if (!settings) return

  const { config } = settings

  if (config) {
    const advancedPath = Path.join(main, config)
    settings = require(advancedPath)
  }

  defaults = Object.assign({}, settings)
}

if (existsSync(confFilePath)) {
  const conf = readFileSync(confFilePath, 'utf-8')
  try {
    setup = JSON.parse(conf)
  }
  catch (e) {
    throw new Error(`Api Loader was unable to parse ${ confFilePath } as JSON`)
  }
}
else {
  const manifestPath = Path.join(main, 'package.json')

  if (existsSync(manifestPath)) {
    const manifest = require(manifestPath)
    setup = manifest[ 'api-loader' ]
  }
}

if (setup) {
  config(setup)
}

exports = module.exports = api
exports.config = config

Object.defineProperty(exports, 'defaults', {
  get () {
    return defaults
  }
})
