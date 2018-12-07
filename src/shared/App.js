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
                <C {...props} {...rest} data={this.props.data} />
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