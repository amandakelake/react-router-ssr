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