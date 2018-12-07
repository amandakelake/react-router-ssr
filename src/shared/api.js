import fetch from "isomorphic-fetch"

export function fetchPopularRepos(language = 'all') {
  // const encodedURI = encodeURI(`https://api.github.com/search/repositories?q=stars:>1+language:${language}&sort=stars&order=desc&type=Repositories`)

  // return fetch(encodedURI)
  //   .then(data => data.json())
  //   .then(repos => repos.items)
  //   .catch(err => {
  //     console.warn(err);
  //     return null
  //   })
  return new Promise(resolve => {
    const data = 'hello fetch'
    resolve(data);
  })
}