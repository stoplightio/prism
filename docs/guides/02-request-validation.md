# Request Validation

Based on the API description document, Prism can take educated guesses at all sorts of validation rules for the request body, headers, query parameters, using keywords like `type`, `format`, `maxLength`, etc.

It can also fail with `401` if security information is missing, and do a bunch of other things the API description document says the real API will do. 

> Prism evaluates paths in the order they are listed in the API specification.

## Parameter Validation

Requests which expect a request body, query parameter, or a path parameter, will be validated.

For example, make a POST with a JSON body that's missing the required `name` parameter. 

```bash
curl -X POST -s -D "/dev/stderr" -H "content-type: application/json" -d '{"tag":"Stowford"}' http://127.0.0.1:4010/pets
```

In this case, Prism will:

- Look for a response with status code `422` on the operation you were trying to execute.
- If there's not a `422` defined, it will look for a response with status code `400` on the operation you were trying to execute.
- In case there's neither a `422` nor a `400` defined, Prism will create a `422` response code for you indicating the validation errors it found along the way. Such response will have a payload conforming to the [application/problem+json][rfc7807] specification.

Since the operation hasn't any error response defined, Prism will generate a 422 response:

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json
content-length: 380
Date: Fri, 05 Jul 2019 07:56:18 GMT
Connection: keep-alive

{
   "type" : "UNPROCESSABLE_ENTITY",
   "title" : "Invalid request.",
   "detail" : "Your request is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.",
   "status" : 422,
   "validation" : [
      {
         "message" : "should have required property 'name'",
         "severity" : "Error",
         "code" : "required",
         "location" : [
            "body"
         ]
      }
   ]
}
```

This error shows effectively that the request is missing a required property `name` from the HTTP request body.

Pairing a GET with a request body is another example of a `422` response you may receive. 

## Server Validation

OpenAPI allows the entire API, or certain operations, to be associated with specific servers.

To make sure the server URL you plan to use is a valid server for the API, or for the particular operation you are attempting, provide it as a `__server` query parameter.

Take this minimalist OpenAPI example:

```yaml
openapi: 3.0.2
paths:
  '/pet':
    get:
      responses:
        '200':
          content:
            '*/*':
              schema:
                type: string
                example: hello world
servers:
  - url: https://stoplight.io/api
    name: Production
  - url: https://stag.stoplight.io/api
    name: Staging
```

You can make a request enforcing server validation by providing the `__server` query string parameter:

```bash
curl http://localhost:4010/pet?__server=https://stoplight.io/api
hello world
```

On the other hand, putting a server which isn't defined in the specification:

```bash
curl http://localhost:4010/pet?__server=https://nonsense.com/api
```

Will give you the following error:

```json
{
  "type": "NO_SERVER_MATCHED_ERROR",
  "title": "Route not resolved, no server matched.",
  "status": 404,
  "detail": "The server url http://nonsense.com/api hasn't been matched with any of the provided servers"
}
```

[petstore-oas2]: ../../examples/petstore.oas2.yaml
[rfc7807]: https://www.tools.ietf.org/html/rfc7807
