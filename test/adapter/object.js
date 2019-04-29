exports = module.exports = {
  handler: (server, route) =>  {
    const { spy } = exports

    spy()


    const { prefix, path, method, handler } = route
    server[ method ](`${ prefix }/${ path }`, handler)
  },
  spy: jest.fn()
}
