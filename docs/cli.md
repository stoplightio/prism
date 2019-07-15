# CLI — Quick start

We'll present here only the main use case. For a the complete list of commands, you can consult the relevant [documentation ⇗][cli-docs].

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


[cli-docs]: ../packages/cli/README.md
