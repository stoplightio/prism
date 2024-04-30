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

### Auto Reloading

Prism watches for changes made to the document it was loaded with. When changes happen, Prism restarts its HTTP server to reflect changes to operations. There is no need to manually stop and start a Prism server after a change to a specification file.

If all operations are removed from a document, Prism won't be reloaded. In this, Prism continues serving operations loaded with the previous restart.

### Modifying Responses

Prism's behavior in looking for the response for your request can be modified with a series of parameters that you can either pass through the `Prefer` header or through a query string parameter. 

Keep in mind, all the query parameters need to be prefixed with double underscores (`__`). If the Prefer header parameter is `code`, the query string will be `__code`.

#### Force Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the `Prefer` header.

```bash
curl -v http://127.0.0.1:4010/pets/123 -H "Prefer: code=404"

HTTP/1.1 404 Not Found
content-type: application/json
content-length: 52
Date: Thu, 09 May 2019 15:26:07 GMT
Connection: keep-alive
```

The body, headers, etc. for this response will be taken from the API description document.

#### Request Specific Examples

You can request a specific example from your document by using the `Prefer` header `example`

```bash
curl -v http://127.0.0.1:4010/pets/123 -H "Prefer: example=exampleKey"
```

#### Dynamic Response

You can override the `--dynamic|-d` CLI parameter (which decides whether the generated example is static or dynamic) through the `dynamic` key in the `Prefer` header.

```bash
curl -v http://127.0.0.1:4010/pets/123 -H "Prefer: dynamic=false"
```

<!-- theme: info -->

> **Remember**: You can combine `code`, `example` and `dynamic` parameters. By default, when the `code` parameter isn't given, Prism always tries to fetch an example using the `exampleKey` from the 200 HTTP responses **only**. You'll need to use the `code` parameter alongside the `example` one for any specific example using a different HTTP status code than 200.

#### Circular references

Even though Prism is technically able to internally handle circular references, the CLI will refuse to mock the provided document in case any circular reference is detected. This is essentially because serialising a circular reference is difficult and dependant on the content type.

## Proxy

This command creates an HTTP server that will proxy all the requests to the specified upstream server. Prism will analyze the request coming in and the response coming back from the upstream server and report the discrepancies with what's declared in the provided OpenAPI document.

Learn more in the [Validation Proxy guide](../guides/03-validation-proxy.md). 

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

### Returning Errors

The header is a handy way to see contract mismatches or incorrect usage in a way that doesn't block the client, so you can monitor all/some production traffic this way record the problems. Omit the optional `--errors` flag to log validation errors without returning errors. In this case, the request flows to the actual API and returns what it returns. 

If you want Prism to make violations considerably more clear, run the proxy command with the `--errors` flag. This will turn any request or response violation into a [RFC 7807 HTTP Problem Details Error](https://tools.ietf.org/html/rfc7807) just like validation errors on the mock server.

```bash
prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2 --errors
```

```bash
curl -v -X POST http://localhost:4010/pet/

< HTTP/1.1 422 Unprocessable Entity
{"type":"UNPROCESSABLE_ENTITY","title":"Invalid request","status":422,"detail":"Your request/response is not valid and the --errors flag is set, so Prism is generating this error for you.","validation":[{"location":["request"],"severity":"Error","code":401,"message":"Invalid security scheme used"}]}
```

The response body contains the found output violations.

### Skip Request Validation

Sometimes, you may want to skip request validation but validate responses. A common scenario would be where you want to check if your HTTP handlers validate the request appropriately. Prism will validate all requests by default, but you can skip this by setting the flag to `--validate-request` flag to `false`.

```bash
prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2 --errors --validate-request false
```

```bash
curl -v -X POST http://localhost:4010/pet/ -d '{"name"": "Skip", "species": 100}'

< HTTP/1.1 422 Unprocessable Entity
{"statusCode": 400, "message": "Pet 'species' field should be a string, got integer", "code": "PET-ERROR-400"}
```

## Logging Options

Use the `-v` command to enable verbose request and response logging for mocking, proxy, and callbacks. 

Command options are ``fatal`, `error`, `warn`, `info`, `debug`, and `silent`. The `info` level is the default and the fallback for custom log levels. 

## Running in Production

When running in development mode (which happens when the `NODE_ENV` environment variable isn't set to `production`) or the `-m` flag is set to false, both the HTTP Server and the CLI (which is responsible of parsing and showing the received logs on the screen) will run within the same process.

Processing logs slows down Prism significantly. If you're planning to use the CLI in production (for example, in a Docker Container), run the CLI with the `-m` flag or set the `NODE_ENV` variable to `production`. This way, the CLI and the HTTP server will run on two different processes so that logs processing, parsing, and printing don't slow down the HTTP requests processing.

## Running behind a proxy

Your environment may need you to route your upstream requests through a proxy server. In this case append the `--upstream-proxy http://proxy.example.com:3128` option to the command for Prism to use it.

<!-- theme: info -->

> Server definitions (OAS3) and Host + BasePath (OAS2) are ignored. You need to manually specify the upstream URL when invoking Prism.
