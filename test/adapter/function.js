exports = module.exports = (server, route) =>  {
  const { spy } = exports

  spy()

  const { prefix, path, method, handler } = route
  server[ method ](`${ prefix }/${ path }`, handler)
}

exports.spy = jest.fn()
