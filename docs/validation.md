# Validation

Prism offers multiple validation layers that help you identify potential issues with your client ahead of the time.

## Parameters validation

Requests to operations which expect a request body, a query parameter or a path parameter will be validated.

For example: let's make a a POST with a JSON body which is missing the required `name` parameter. We'll be using the [petstore openapi 2 version][petstore-oas2]

```bash
curl -X POST -s -D "/dev/stderr" -H "content-type: application/json" -d '{"tag":"Stowford"}' http://127.0.0.1:4010/pets | json_pp
```

In such case, Prism will:

* Look for a response with status code `422` on the operation you were trying to execute
* If there's not a `422` defined, it will look for a response with status code `400` on the operation you were trying to execute
* In case there's neither a `422` nor a `400` defined, Prism will create a `422` response code for you indicating all the validation errors it found along the way. Such response will have a payload conforming the [application/problem+json][rfc7807] specification.

To get back to our example, since the operation hasn't any error response defined, Prism will generate a 422 response for me:

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json
content-length: 380
Date: Fri, 05 Jul 2019 07:56:18 GMT
Connection: keep-alive

{
   "type" : "https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY",
   "title" : "Invalid request body payload",
   "detail" : "Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.",
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

## Server Validation

OpenAPI lets API spec authors make only certain servers available, and they also allow certain
operations to be restricted to certain servers. Make sure the server URL you plan to use is a valid
server this the particular operation you are attempting. by providing a `__server` query param.

Take this minimalist spec (OpenAPI v3) example:

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

On the other hand, putting a server which is not defined in the specification, for example:

```bash
curl http://localhost:4010/pet?__server=https://nonsense.com/api
```

Will give you the following error:

```json
{
  "type": "https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR",
  "title": "Route not resolved, no server matched.",
  "status": 404,
  "detail": "The server url http://nonsense.com/api hasn't been matched with any of the provided servers"
}
```

[petstore-oas2]: ../examples/petstore.oas2.yaml
[rfc7807]: https://www.tools.ietf.org/html/rfc7807
