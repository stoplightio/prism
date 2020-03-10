# Postman Collections support

Prism offers a _limited_ support for Postman Collection. The basic workflow of using Prism (both from the CLI and deployed in a Docker container) are fundamentally the same:

```bash
prism mock https://raw.githubusercontent.com/postmanlabs/postman-collection/develop/examples/collection-v2.json

info      GET        http://127.0.0.1:4010/status/200
info      POST       http://127.0.0.1:4010/post
info      PUT        http://127.0.0.1:4010/status/201
info      GET        http://127.0.0.1:4010/post
info      GET        http://127.0.0.1:4010/status/400/
info      GET        http://127.0.0.1:4010/path/to/document
start     Prism is listening on http://127.0.0.1:4010
```

…and then use the trusty curl to try out the server:

```bash
curl -s -D "/dev/stderr" http://127.0.0.1:4010/status/200

HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: *
Content-type: application/json
authorization: Hawk id="dh37fgj492je", ts="1448549987", nonce="eOJZCd", mac="O2TFlvAlMvKVSKOzc6XkfU6+5285k5p3m5dAjxumo2k="
set-cookie: null
Content-Length: 15
Date: Mon, 09 Mar 2020 19:19:31 GMT
Connection: keep-alive

"response body"%
```

For a complete CLI overview, please see the [CLI page](../getting-started/03-cli.md)

## Known limitations

There are some known limitations that it's important to keep in mind:

### Authentication

Postman supports a few authentication schemes which OpenAPI does not, such as Hawk and AWS. In this case Prism will do a simplified version of security validation, and just check you've got the right headers populated.

### Events

Events are linked to the Postman hosted platform, and so Prism is going to skip this section entirely.

For this reason, if some of these event handlers have scripts that modify a local variable (globals one are ignored by Prism since they are not tracked in the Postman Application and not the singular Postman Collection) used in some of the request/response pair, Prism won't be aware of these changes.

### JSON Schema Generation

OpenAPI 2 and 3 are schema driven, while Postman Collections are examples driven.

Essentially, while in OpenAPI 2/3 you can either define an example request/response body OR define a JSON Schema to describe how the payload will look like, in a Postman Collections you can only define examples.

For such reason, Prism will _try_ to infer a JSON Schema from an example, and use such one to perform request/response validation as well as examples generation in case the it is running in `dynamic` mode.

Infer a JSON Schema from a payload is an operation usually complicated — and there's no way a perfect result will be achieved. We can cover the base cases, but keep in mind you might get validation errors that are legit.

To give an example, this JSON object:

```json
{
  "name": "Bugatti Veyron",
  "type": "Sport Car",
  "speed": 3000
}
```

will likely generate this schema:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "type": {
      "type": "string"
    },
    "speed": {
      "type": "number"
    }
  }
}
```

Although the result seems good:

- There is no way to understand whether all or some of the properties are required or not, so they'll all be marked as optionals.
- There is no way to understand whether a type is indeed an `enum` instead of a regular `string`. In this specific example, maybe the author's intention is that type is either `Sport Car` or `SUV`
- There is no way to understand whether a type can be something stricter; for example, maybe the author's intention was to mark the `speed` property as `integer` instead of `number`.

### Operations Merging

Postman Collections allows to define the same response multiple times, as long they differ for the returned response type, payload, examples. Prism will try to merge all these definitions in a single operation and then selecting the appropriate example based on its internal negotiator.
