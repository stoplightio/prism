# Prism CLI

Prism CLI for now only has one command: `mock`.

## Mock server

Running Prism on the CLI will create a HTTP mock server.

```bash
prism mock https://raw.githack.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
✔  success   Prism is listening on http://127.0.0.1:4010
●  note      GET        http://127.0.0.1:4010/pets
●  note      POST       http://127.0.0.1:4010/pets
●  note      GET        http://127.0.0.1:4010/pets/{id}
●  note      DELETE     http://127.0.0.1:4010/pets/{id}
```

Then in another tab, you can hit the HTTP server with your favorite HTTP client.

```bash
curl -s -D "/dev/stderr" http://127.0.0.1:4010/pets/123 | json_pp

HTTP/1.1 200 OK
content-type: application/json
content-length: 85
Date: Thu, 09 May 2019 15:25:40 GMT
Connection: keep-alive

{
   "tag" : "proident et ",
   "id" : -66955049,
   "name" : "ut consectetur cillum sit exercitation"
}
```

Responses will be mocked using realistic data that conforms to the type in the description.

### Auto-reloading

Prism watches for changes made to a document it was loaded with.
When they happen, Prism restarts its HTTP server to reflect changes to operations.
There is no need to manually stop and start a Prism server after a change to a specification file.

In case of removing all of the operations in a document, Prism will not be reloaded.
In such a case, Prism will keep serving operations loaded with the previous restart. 

## Determine Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the query
string:

```bash
curl -v http://127.0.0.1:4010/pets/123?__code=404

HTTP/1.1 404 Not Found
content-type: application/json
content-length: 52
Date: Thu, 09 May 2019 15:26:07 GMT
Connection: keep-alive
```

The body, headers, etc. for this response will be taken from the API description document.

## Running in Production

When running in development mode (which happens when the `NODE_ENV` environment variable is not set to `production`) or the `-m` flag is set to false, both the HTTP Server and the CLI (which is responsible of parsing and showing the received logs on the screen) will run within the same process.

Processing logs slows down the process significantly. If you're planning to use the CLI in production (for example in a Docker Container) we recommend to run the CLI with the `-m` flag or set the `NODE_ENV` variable to `production`. In this way, the CLI and the HTTP server will run on two different processes, so that logs processing, parsing and printing does not slow down the http requests processing.
