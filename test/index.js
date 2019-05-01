const express = require('express')
const app = express()
const { PORT = 3000 } = process.env

const api = require('../index.js')
const { config } = api

config({
  paths: './test/routes'
})

api(app)

app.listen(PORT, function () {
  /* eslint-disable-next-line */
  console.log(`app started on port ${ PORT } - ${ new Date() }`)
})
