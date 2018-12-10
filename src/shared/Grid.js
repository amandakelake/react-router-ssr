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

  // deal with update data when navigate in client-side
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
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