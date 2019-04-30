const TAIL = /\/$/

class Route {
  constructor ({
    key,
    filepath,
    endpoint,
    parent,
    prefix,
    method
  }) {
    prefix = prefix.replace(TAIL, '')
    prefix = prefix[ 0 ] === '/'
      ? prefix
      : prefix && `/${ prefix }`

    const parentPath = parent && parent.path || ''
    let path

    if (method) {
      if ('url' in endpoint) {
        path = endpoint.url
      }
      else if ('path' in endpoint && (!parent || parent.endpoint !== endpoint)) {
        if (Array.isArray(path)) {
          throw new Error(`API Loader: extending a set of path is not supported (${ filepath })`)
        }

        const paths = extract(endpoint.path, parentPath)

        path = paths.length === 1
          ? paths[ 0 ]
          : paths
      }
      else {
        path = parentPath
      }

      const handler  = endpoint.handler || endpoint

      if (!(handler instanceof Function)) {
        throw new Error(`API Loader: no handler function found for endpoint at ${ filepath }`)
      }

      this.handler = handler
    }
    else if (endpoint && 'url' in endpoint) {
      path = endpoint.url
    }
    else if (endpoint && 'path' in endpoint) {
      const paths = extract(endpoint.path, parentPath)
      path = paths.length < 2 ? paths[ 0 ] : paths
    }
    else {
      path = parentPath
        ? `${ parentPath }/${ key }`
        : key
    }

    this.key = key
    this.prefix = prefix
    this.endpoint = endpoint
    this.parent = parent
    this.method = method
    this.filepath = filepath
    this.path = path
  }
}

function extract (path, parentPath = '') {
  let paths = Array.isArray(path)
    ? path
    : [ path ]

  return paths.map(tip => {
    let path
    let tail
    let substitute

    tip = tip.replace(TAIL, '')

    if (tip.indexOf('~') === 0) {
      substitute = true
      tail = tip.substr(2)
    }
    else {
      tail = tip[ 0 ] === '/'
        ? tip.substr(1)
        : tip
    }

    if (substitute) {
      const index = parentPath.lastIndexOf('/')
      const prefix = parentPath.substr(0, index)
      path = prefix === '/' || !prefix
        ? tail
        : `${ prefix }/${ tail }`
    }
    else if (parentPath === '/' || !parentPath) {
      path = tail
    }
    else {
      path = tail
        ? `${ parentPath }/${ tail }`
        : parentPath
    }

    return path
  })
}

module.exports = Route
