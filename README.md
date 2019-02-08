# Prism

<a href="https://codeclimate.com/github/stoplightio/prism/maintainability"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/maintainability" /></a>

<a href="https://codeclimate.com/github/stoplightio/prism/test_coverage"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/test_coverage" /></a>

## Use cases

### Run a mock server locally to test requests

```
spec
  - path: /
    server: http://x.com/v1
  - path: /
    server: http://x.com/v2
  - path: /a
    server: http://x.com
  - path: /b
    server: .
```

**w/o server validation**

`prism run --spec spec --port 3000`


`curl localhost:3000/a` - ok

`curl localhost:3000/b` - ok

`curl localhost:3000/v1/` - error: no such path exists

`curl localhost:3000/v2/` - error: no such path exists

**w/ server validation**

`curl localhost:3000/a?__server=http://x.com` - ok

`curl localhost:3000/b` - ?

`curl localhost:3000/v1/?__server=http://x.com/v1` - ok

`curl localhost:3000/v2/?_server=http://x.com/v2` - ok



`prism run --spec spec --port 3000 --server http://x.com`


`curl localhost:3000/a` - ok

`curl localhost:3000/b` - error: no such path exists

`curl localhost:3000/v1/` - error: no such path exists

`curl localhost:3000/v2/` - error: no such path exists

### Run a server to mock a public API

**w/o server validation**

`prism run --spec spec --port 3000`

`configure DNS to point http://x.com to "localhost:3000"`


`curl http://x.com/a` - ok

`curl http://x.com/b` - ok

`curl http://x.com/` - matches ambigously

`curl http://x.com/v1/` - error: no such path exists ( GET /v1/ does not match any path from spec )

`curl http://x.com/v2/` - error: no such path exists ( GET /v2/ does not match any path from spec )

**w/ server validation**

`prism run --spec spec --port 3000 --server http://x.com`

`prism run --spec spec --port 3001 --server http://x.com/v1`

`prism run --spec spec --port 3002 --server http://x.com/v2`


`configure DNS and routing to point http://x.com to "localhost:3000"`

`configure DNS and routing to point http://x.com/v1 to "localhost:3001"`

`configure DNS and routing to point http://x.com/v2 to "localhost:3002"`


`curl http://x.com/a` - ok

`curl http://x.com/b` - ok

`curl http://x.com/` - no match

`curl http://x.com/v1/` - ok

`curl http://x.com/v2/` - ok

### Use in code

```
app.namespace('/v1').get('/', (req, res) => {
  return prism.process({ baseUrl: 'http://x.com/v1', path: '/' });
});
```

## Development

### Common issues

1. `jest --watch` throws ENOSPC error

- [optional] Install `watchman` as per [documentation](https://facebook.github.io/watchman/docs/install.html#installing-from-source)
- Modify `fs.inotify.max_user_watches` as per [issue resolution](https://github.com/facebook/jest/issues/3254)
