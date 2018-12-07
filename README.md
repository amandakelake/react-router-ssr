# Server Rendering with React and React Router


1. Init
2. What we need to start up the react ssr
3. Pass props
4. Have the server rendered and client rendered content be identical
5. Fetch some data from API
6. Routing
	1. fetching data on server based on the route the user requested
	2. render client side routes
	3. pass props by `context`, access props data in `props.staticContext` of Route
	4. fetch data in client-side
	5. deal with update data when navigate in client-side


## 1、Init
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
Just copy the code , don’t ask why right now
```
.DS_Store
npm-debug.log
yarn-error.log
.idea
*.iml
.vscode

node_modules/
public/
server.js

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
	 // this file is the server entry, here we need to git ignore it,because it will changed everytime we change the code of src folder
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

## 2、What we need to start up the react ssr
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

## 3、try to pass props

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

## 4、have the server rendered and client rendered content be identical

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

## 5、Fetch some data from API
Create a file
```
▶ touch src/shared/api.js
```

`src/shared/api.js`
```js
import fetch from 'isomorphic-fetch'

export default function fetchPopularRepos(language = 'all') {
  const encodedURI = encodeURI(`https://api.github.com/search/repositories?q=stars:>1+language:${language}&sort=stars&order=desc&type=Repositories`)

  return fetch(encodedURI)
    .then((data) => data.json())
    .then((repos) => repos.items)
    .catch((error) => {
      console.warn(error)
      return null
    });
}
```

`src/server/index.js`
```js
// ...
import fetchPopularRepos from "../shared/api"
// ...
app.get("*", (req, res, next) => {
  fetchPopularRepos()
    .then((data) => {
      const markup = renderToString(
        <App data={data} />
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
    })
})
```

Here, we can use `async/awaut` to simply the code

Create a UI Componnet `Grid`
```
▶ touch src/shared/Grid.js
```
```js
import React, { Component } from 'react'

class Grid extends Component {
  render() {
    const repos = this.props.data

    return (
      <ul style={{ display: 'flex', flexWrap: 'wrap' }}>
        {repos.map(({ name, owner, stargazers_count, html_url }) => (
          <li key={name} style={{ margin: 30 }}>
            <ul>
              <li><a href={html_url}>{name}</a></li>
              <li>@{owner.login}</li>
              <li>{stargazers_count} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

export default Grid
```

Import `Grid` to `App`, change the file `src/shared/App.js`
```js
import React, { Component } from 'react'
import Grid from './Grid'

class App extends Component {
  render() {
    return (
      <div>
        <Grid data={this.props.data} />
      </div>
    )
  }
}

export default App
```

Now  refresh the app, U should have seen some real data from remote github API rendered in the page

and, in real development mode, U need to handle **cross-origin** issues yourself by using `http-proxy-middleware`


## 6、Routing
> React Router is a declarative, component based approach to routing. However, when we’re dealing with server side rendering with React Router, we need to abandon that paradigm and move all of our routes to a central route configuration. The reason for this is because both the client and the server need to be aware of our routes. The client because it obviously needs to know which components to render as the user navigates around our app and the server because it needs to know which data to fetch when the user requests a specific path

1. fetching data on server based on the route the user requested
2. render client side routes
3. pass props by `context`, access props data in `props.staticContext` of Route
4. fetch data in client-side
5. deal with update data when navigate in client-side

#### 1）fetching data on server based on the route the user requested
```
▶ touch src/shared/routes.js
▶ touch src/shared/Home.js
```

`Home` is a common component, nothing special
```js
import React from 'react'

export default function Home () {
  return (
    <div>
      Select a Language
    </div>
  )
}
```

Let’s see `src/shared/routes.js`
```js
import Home from './Home'
import Grid from './Grid'
import { fetchPopularRepos } from './api'

const routes = [
  {
    path: '/',
    exact: true,
    component: Home,
  },
  {
    path: '/popular/:id',
    component: Grid,
    // pass a fetchInitialData attribute -> to fetch initial data by using the 'id' parameter from the URL
    fetchInitialData: (path = '') => fetchPopularRepos(path.split('/').pop())
  }
]

export default routes
```
Pay  attention to  the `fetchInitialData` property
when a user makes a GET request with that path from the server, we’ll go ahead and invoke `fetchInitialData` passing it the path and what we’ll get back is a promise that will eventually resolve with the data we need to render

Let’s head back to `src/server/index.js`
```js
// ...
app.get("*", (req, res, next) => {

  const activeRoute = routes.find((route) => matchPath(req.url, route)) || {}
  // check if the activeRoute has a fetchInitialData property
  const promise = activeRoute.fetchInitialData
    ? activeRoute.fetchInitialData(req.path)
    : Promise.resolve()

  promise.then((data) => {
    const markup = renderToString(
      <App data={data} />
    )

    res.send('...')
  }).catch(next)
})
```

Now , head to `localhost:3000/popular/javascript`, the server render the correct page with requested data.

But , when refresh `localhost:3000`, you’ll get an error `Cannot read property 'map' of undefined`,  because we aren’t rendering `Grid` inside of App anymore (since we’re rendering our Routes, render `Home`component) instead, that data isn’t making its way to `Grid` and therefor, props.data inside of Grid is undefined. Basically Grid is no longer receiving the data it needs.

Let’s fix it


#### 2）render client side routes, pass global data to client
First, use React Router’s `BrowserRouter`  to wrap  the browser `App`,
```js
// src/browser/index.js
import React from 'react'
import { hydrate } from 'react-dom'
import App from '../shared/App'
import { BrowserRouter } from 'react-router-dom'

hydrate(
  <BrowserRouter>
    <App data={window.__INITIAL_DATA__} />
  </BrowserRouter>,
  document.getElementById('app')
);
```

just like `BrowserRouter` in client-side, we need `StaticRouter` to do the soma on server-side
```js
// src/server/index.js
//...
import { StaticRouter, matchPath } from "react-router-dom"
//...

const markup = renderToString(
  <StaticRouter location={req.url} context={{}}>
    <App data={data}/>
  </StaticRouter>
)

//...
```

And then , pass the components rendered by React Router the fetchInitialData property if it exists so the client can also invoke it if it doesn’t already have the data from the server. use `Routes render` method so we can create the element ourself and pass it any props
```js
// src/shared/App.js
import React, { Component } from 'react'
import Grid from './Grid'
import routes from './routes'
import { Route } from 'react-router-dom'

class App extends Component {
  render() {
    return (
      <div>
        {/* <Grid data={this.props.data} /> */}
        {routes.map(({ path, exact, component: C, ...rest }) => (
          <Route key={path} path={path} exact={exact} render={(props) => (<C {...props} {...rest} />)} />
        ))}
      </div>
    )
  }
}

export default App
```

Before go on, we quickly create two components: `Navbar` and `NoMatch`
```
▶ touch src/shared/Navbar.js src/shared/NoMatch.js
```

```js
// src/shared/Navbar.js
import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar () {
  const languages = [{
    name: 'All',
    param: 'all'
  }, {
    name: 'JavaScript',
    param: 'javascript',
  }, {
    name: 'Ruby',
    param: 'ruby',
  }, {
    name: 'Python',
    param: 'python',
  }, {
    name: 'Java',
    param: 'java',
  }]

  return (
    <ul>
      {languages.map(({ name, param }) => (
        <li key={param}>
          <NavLink activeStyle={{fontWeight: 'bold'}} to={`/popular/${param}`}>
            {name}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
```

```js
// src/shared/NoMatch.js
import React from 'react'

export default function NoMatch() {
  return (
    <div>Four Oh Four</div>
  )
}
```

```js
// src/shared/App.js
import React, { Component } from 'react'
import routes from './routes'
import { Route, Switch } from 'react-router-dom'
import Navbar from './Navbar'
import NoMatch from './NoMatch'

class App extends Component {
  render() {
    return (
      <div>
        <Navbar />

        <Switch>
          {routes.map(({ path, exact, component: C, ...rest }) => (
            <Route
              key={path}
              path={path}
              exact={exact}
              render={(props) => (
                <C {...props} {...rest} />
              )}
            />
          ))}
          <Route render={(props) => <NoMatch {...props} />} />
        </Switch>
      </div>
    )
  }
}

export default App
```

Now we can see the following page when refresh `/` route

but, if we click on one of the Links we get an error - `Cannot read property 'map' of undefined`.

Remember the problem we mentioned above?

> Because we aren’t rendering Grid inside of App anymore (since we’re rendering our Routes, render Homecomponent) instead, that data isn’t making its way to Grid and therefor, props.data inside of Grid is undefined. Basically Grid is no longer receiving the data it needs.

Add the `data` props to render method of Route
```js
<C {...props} {...rest} data={this.props.data} />
```

#### 3）pass props by `context`, access props data in `props.staticContext` of Route

Anything that we stick on the object that we pass to context, we’ll be able to access later on in any component as `props.staticContext`. So instead of passing data to App, let’s use `context` instead

```js
// src/server/index.js
//...

promise.then((data) => {
  const context = { data }

  const markup = renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  )

//...
```

Change the file `src/shared/Grid.js`
`const repos = this.props.data` -> `const repos = this.props.staticContext.data`
```js
import React, { Component } from 'react'

class Grid extends Component {
  render() {
    const repos = this.props.staticContext.data

    return (
      <ul style={{ display: 'flex', flexWrap: 'wrap' }}>
        {repos.map(({ name, owner, stargazers_count, html_url }) => (
          <li key={name} style={{ margin: 30 }}>
            <ul>
              <li><a href={html_url}>{name}</a></li>
              <li>@{owner.login}</li>
              <li>{stargazers_count} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

export default Grid
```

#### 4)   fetch data in client-side
`App` isn’t passing down that data to the `Grid` component anymore. Instead of passing data down, we can just grab it off the window object inside of the `Grid` component itself

`<App data={window.__INITIAL_DATA__} />` -> `<App />`
```js
// src/browser/index.js
import React from 'react'
import { hydrate } from 'react-dom'
import App from '../shared/App'
import { BrowserRouter } from "react-router-dom"

hydrate(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('app')
);
```

Then comes to the `Grid` component
```js
// src/shared/Grid.js
import React, { Component } from 'react'
class Grid extends Component {
  constructor(props) {
    super(props)

    let repos
    // the global variable has been inject by webpack plugin
    // plugins: [new webpack.DefinePlugin({ __isBrowser__: "true" })]
    if (__isBrowser__) {
      repos = window.__INITIAL_DATA__
      delete window.__INITIAL_DATA__
    } else {
      // get data from content of router
      repos = this.props.staticContext.data
    }

    this.state = {
      repos,
      loading: repos ? false : true,
    }

    this.fetchRepos = this.fetchRepos.bind(this)
  }
  componentDidMount() {
    if (!this.state.repos) {
      // when react takes over the page, fetch data in client
      this.fetchRepos(this.props.match.params.id)
    }
  }
  fetchRepos(lang) {
    this.setState(() => ({
      loading: true
    }))

    this.props.fetchInitialData(lang)
      .then((repos) => this.setState(() => ({
        repos,
        loading: false,
      })))
  }
  render() {
    const { repos, loading } = this.state

    if (loading === true) {
      return <p>LOADING</p>
    }

    return (
      <ul style={{ display: 'flex', flexWrap: 'wrap' }}>
        {repos.map(({ name, owner, stargazers_count, html_url }) => (
          <li key={name} style={{ margin: 30 }}>
            <ul>
              <li><a href={html_url}>{name}</a></li>
              <li>@{owner.login}</li>
              <li>{stargazers_count} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

export default Grid
```

Now when we navigate from / to /popular/javascript everything works fine

But when we navigate from one language to another, nothing happens, it will not update, what’s wrong?

Again, this is just a React thing. The props are changing but the component never re-mounts, so componentDidMount isn’t called again. We can use React’s componentDidUpdate lifecycle method to fix this issue

#### 5)  deal with update data when navigate in client-side

```js
// src/shared/Grid.js

componentDidUpdate (prevProps, prevState) {
  if (prevProps.match.params.id !== this.props.match.params.id) {
    this.fetchRepos(this.props.match.params.id)
  }
}
```


Everything works fine! Cool


But it’s a little complex, is it worth the benefits to your app?



reference: [Server Rendering with React and React Router](https://tylermcginnis.com/react-router-server-rendering/)
