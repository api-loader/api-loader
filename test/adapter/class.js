const Adapter = require('../../adapter')

class TestAdapter extends Adapter {
  init () {

  }

  handler (server, route) {
    const { spy } = TestAdapter

    spy()

    const { prefix, path, method, handler } = route
    server[ method ](`${ prefix }/${ path }`, handler)
  }

  set () {

  }
}

TestAdapter.spy = jest.fn()

module.exports = TestAdapter
