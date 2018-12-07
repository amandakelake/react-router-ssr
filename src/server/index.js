import React from 'react'
import express from "express"
import cors from "cors"
import { renderToString } from "react-dom/server"
import { matchPath, StaticRouter } from 'react-router-dom'
import serialize from "serialize-javascript"

import App from '../shared/App'
import routes from "../shared/routes"
import { fetchPopularRepos } from "../shared/api"

const app = express()

app.use(cors())

// We're going to serve up the public
// folder since that's where our
// client bundle.js file will end up.
app.use(express.static("public"))

app.get("*", (req, res, next) => {

  const activeRoute = routes.find((route) => matchPath(req.url, route)) || {}
  // check if the activeRoute has a fetchInitialData property
  const promise = activeRoute.fetchInitialData
    ? activeRoute.fetchInitialData(req.path)
    : Promise.resolve()

  promise.then((data) => {
    const context = { data }
    // just like BrowserRouter in client-side, we need StaticRouter to do the soma on server-side
    // This context object contains the results of the render
    const markup = renderToString(
      <StaticRouter location={req.url} context={context}>
        <App data={data} />
      </StaticRouter>

    )

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SSR with RR</title>
          <script src="/bundle.js" defer></script>
          <script>window.__INITIAL_DATA__ = ${serialize(data)}</script>
        </head>

        <body>
          <div id="app">${markup}</div>
        </body>
      </html>
    `)
  }).catch(next)
})

app.listen(3000, () => {
  console.log(`Server is listening on port: 3000`)
})