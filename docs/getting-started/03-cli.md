# Prism CLI

Prism CLI has two commands: `mock` and `proxy`.

## Mock Server

[Mocking](../guides/01-mocking.md) is available through the CLI mock command.

```bash
prism mock https://raw.githack.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
✔  success   Prism is listening on http://127.0.0.1:4010
●  note      GET        http://127.0.0.1:4010/pets
●  note      POST       http://127.0.0.1:4010/pets
●  note      GET        http://127.0.0.1:4010/pets/10
●  note      DELETE     http://127.0.0.1:4010/pets/10
```

Here you can see all the "operations" (a.k.a endpoints or resources) that Prism has found in your 
API description. Prism will shove an example, default, or other reasonably realistic value in there
so you can copy and paste (or Ctrl+Click / CMD+Click in fancy terminals) to open the URL in your browser.

You can use whatever HTTP client you like, for example, trusty curl:

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

## Modifying Responses

#### Force Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the query string:

```bash
curl -v http://127.0.0.1:4010/pets/123?__code=404

HTTP/1.1 404 Not Found
content-type: application/json
content-length: 52
Date: Thu, 09 May 2019 15:26:07 GMT
Connection: keep-alive
```

The body, headers, etc. for this response will be taken from the API description document.

#### Request Specific Examples

You can request a specific example from your document by using the `__example` query string parameter.

```bash
curl -v http://127.0.0.1:4010/pets/123?__example=exampleKey
```

#### Dynamic Response

You can override the `--dynamic|-d` CLI param (which decides whether the generated example is static or dynamic) through the `__dynamic` query string parameter.

```bash
curl -v http://127.0.0.1:4010/pets/123?__dynamic=false
```

## Proxy

This command creates an HTTP server that will proxy all the requests to the specified upstream server. Prism will analyze the request coming in and the response coming back from the upstream server and report the discrepancies with what's declared in the provided OpenAPI document.

Learn more about the ideas here in our [Validation Proxy guide](../guides/03-validation-proxy.md), or see below for the quick n dirty how to CLI.

```bash
$ prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2

[CLI] ...  awaiting  Starting Prism...
[HTTP SERVER] ℹ  info      Server listening at http://127.0.0.1:4010
[CLI] ●  note      GET        http://127.0.0.1:4010/pets
[CLI] ●  note      POST       http://127.0.0.1:4010/pets
[CLI] ●  note      GET        http://127.0.0.1:4010/pets/10
```

The output violations will be reported on the standard output and as a response header (`sl-violations`).

```bash
prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2
```

```bash
curl -v -s http://localhost:4010/pet/10 > /dev/null

< sl-violations: [{"location":["request"],"severity":"Error","code":401,"message":"Invalid security scheme used"}]
```

You can see there's a `sl-violations` header which is a JSON object with all the violations found in the response.

The header is a handy way to see contract mismatches or incorrect usage in a way that doesn't block the client, so you can monitor all/some production traffic this way record the problems. If you want Prism to make violations considerably more clear, run the proxy command with the `--errors` flag. This will turn any request or response violation into a [RFC 7807 HTTP Problem Details Error](https://tools.ietf.org/html/rfc7807) just like validation errors on the mock server.

```bash
prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2 --errors
```

```bash
curl -v -X POST http://localhost:4010/pet/

< HTTP/1.1 422 Unprocessable Entity
{"type":"https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY","title":"Invalid request body payload","status":422,"detail":"Your request/response is not valid and the --errors flag is set, so Prism is generating this error for you.","validation":[{"location":["request"],"severity":"Error","code":401,"message":"Invalid security scheme used"}]}
```

The response body contains the found output violations.

<!-- theme: info -->
> Server definitions (OAS3) and Host + BasePath (OAS2) are ignored. You need to manually specify the upstream URL when invoking Prism.

## Running in Production

When running in development mode (which happens when the `NODE_ENV` environment variable is not set to `production`) or the `-m` flag is set to false, both the HTTP Server and the CLI (which is responsible of parsing and showing the received logs on the screen) will run within the same process.

Processing logs slows down the process significantly. If you're planning to use the CLI in production (for example in a Docker Container) we recommend to run the CLI with the `-m` flag or set the `NODE_ENV` variable to `production`. In this way, the CLI and the HTTP server will run on two different processes, so that logs processing, parsing and printing does not slow down the http requests processing.
