module.exports = (server, route, adapter) => {
  if (!adapter) {
    const { prefix, path, method, handler } = route
    server[ method ](`${ prefix }/${ path }`, handler)
  }
  else if (adapter instanceof Function) {
    adapter(server, route)
  }
  else {
    adapter.handler(server, route)
  }
}
