# Server Rendering with React and React Router

## Init
```
▶ mkdir react-router-ssr
▶ cd react-router-ssr
▶ npm init -y
▶ git init

▶ touch .gitignore
▶ touch .babelrc
▶ mkdir src && mkdir src/browser src/shared src/server
▶ touch webpack.config.js


▶ npm i -D babel-core babel-loader@7 babel-preset-env babel-preset-react babel-plugin-transform-object-rest-spread webpack webpack-cli webpack-node-externals nodemon
▶ npm i react react-dom react-router-dom isomorphic-fetch serialize-javascript express cors
```

Add  the follow settings to `.gitignore`
```
.DS_Store
node_modules/
dist/
npm-debug.log
yarn-error.log
.idea
*.iml
```

Add the follow script to `package.json`
```json
"start": "webpack -w & nodemon server.js"
```

Add the follow code to  `.babelrc`
```json
{
  "presets": [
    "env",
    "react"
  ],
  "plugins": [
    "transform-object-rest-spread"
  ]
}
```

Add the following code to `webpack.config.js`
```js
const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

const browserConfig = {
  entry: './src/browser/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      { test: /\.(js)$/, use: 'babel-loader' },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __isBrowser__: "true"
    })
  ]
}

const serverConfig = {
  entry: './src/server/index.js',
  target: 'node',
  externals: [nodeExternals()], // ignores node_modules when bundling in Webpack
  output: {
    path: __dirname,
    filename: 'server.js',
    publicPath: '/'
  },
  module: {
    rules: [
      { test: /\.(js)$/, use: 'babel-loader' }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __isBrowser__: "false"
    })
  ]
}

module.exports = [browserConfig, serverConfig]
```

## What we need to start up the react-ssr
1. A react component -> even just a basic one that renders “Hello World” for now
2. A server which spits back our basic React component after it’s wrapped it in some HTML structure
3. A React app which is going to pick up from where the server rendered HTML left off and add in any event listeners to the existing markup where needed

* create a file -> `src/shared/App.js`
```js
import React, { Component } from 'react';

class App extends Component {
  render() {
    return (
      <div>
        Hello World
      </div>
    );
  }
}

export default App;
```

* create a file -> `src/server/index.js`

```js
import express from "express"
import cors from "cors"

const app = express()

app.use(cors())

// We're going to serve up the public folder since that's where our  client bundle.js file will end up.
app.use(express.static("public"))

app.listen(3000, () => {
  console.log(`Server is listening on port: 3000`)
})
```

Send back a HTML skeleton along with the markup from our App component inside of it
```js
import express from "express"
import cors from "cors"
import React from 'react'
import { renderToString } from "react-dom/server"
import App from "../shared/App"

const app = express()

app.use(cors())

// We're going to serve up the public folder since that's where our  client bundle.js file will end up.
app.use(express.static("public"))

app.get("*", (req, res, next) => {
  const markup = renderToString(<App />)
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR with RR</title>
        <script src="/bundle.js" defer></script>
      </head>

      <body>
        <div id="app">${markup}</div>
      </body>
    </html>
  `)
})

app.listen(3000, () => {
  console.log(`Server is listening on port: 3000`)
})
```

* create a file -> `src/browser/index.js`
```js
import React from 'react'
import { hydrate } from 'react-dom'
import App from '../shared/App'

hydrate(
  <App />,
  document.getElementById('app')
);
```

Now run `npm start` in terminal, when you visit localhost:3000 you should see “Hello World”. That “Hello World” was initially rendered on the server

## try to pass props

`src/server/index.js`
```js
  const markup = renderToString(
    <App data='server' />
  )
```

`src/browser/index.js`
```js
hydrate(
  <App data='client' />,
  document.getElementById('app')
);
```

refresh the app, you’ll initially see “Hello world, server” (which is what was rendered on the server), **then when React takes over**, you’ll see “Hello world, client” 

## have the server rendered and client rendered content be identical 

[ReactDOM – React](https://reactjs.org/docs/react-dom.html#hydrate)
> React expects that the rendered content is identical between the server and the client. It can patch up differences in text content, but you should treat mismatches as bugs and fix them. In development mode, React warns about mismatches during hydration. There are no guarantees that attribute differences will be patched up in case of mismatches. This is important for performance reasons because in most apps, mismatches are rare, and so validating all markup would be prohibitively expensive.

sharing initial data from the server to the client by using the window object.

`src/server/index.js`
```js
// ...
import serialize from "serialize-javascript"

app.get("*", (req, res, next) => {
  const name = 'Tyler'
  const markup = renderToString(
    <App data={name}/>
  )

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR with RR</title>
        <script src="/bundle.js" defer></script>
        <script>window.__INITIAL_DATA__ = ${serialize(name)}</script>
      </head>

      <body>
        <div id="app">${markup}</div>
      </body>
    </html>
  `)
})


```

Now on the client, we can grab the name from `window.__INITIAL_DATA__`.

`src/browser/index.js`
```js
hydrate(
  <App data={window.__INITIAL_DATA__} />,
  document.getElementById('app')
);
```

## Fetch some data from API
