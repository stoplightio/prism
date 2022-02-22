# Errors

All the errors that Prism returns conform to [RFC7807](https://tools.ietf.org/html/rfc7807) - Problem Details for HTTP APIs, which means you'll always get a **JSON object** with the following properties:

- `type` (string)
- `title` (string)
- `status` (number)
- `detail` (string)

This document enumerates all the possible errors returned by Prism and provides some further information on how to solve them.

## Routing errors

This class of errors is returned when Prism is trying to identify the right resource to use to respond to the provided HTTP Request.

### NO_BASE_URL_ERROR

**Message: Attempted to make a request to a server but neither baseUrl param were provided nor servers were defined in the spec**

**Returned Status Code: `400`**

**Explanation:** This error occurs when Prism is being used as a proxy and the current document is missing at least a server in the dedicated array (both globally and locally). The proxy functionality is currently disabled in Prism, so this error should never happen.

---

### NO_RESOURCE_PROVIDED_ERROR

**Message: Route not resolved, no resource provided**

**Returned Status Code: `404`**

**Explanation:** This error occurs when the current document does not have any endpoint.

##### Example

```yaml
openapi: 3.0.1
paths:
```

`curl -X POST http://localhost:4010/pets`

---

### NO_PATH_MATCHED_ERROR

**Message: Route not resolved, no path matched**

**Returned Status Code: `404`**

**Explanation:** This error occurs when the current document does not have any endpoint matching the requested URL.

##### Example

```yaml
openapi: 3.0.1
paths:
  /pets:
    get:
      responses:
        200:
          description: Hey
```

`curl -X POST http://localhost:4010/hello`

---

### NO_SERVER_MATCHED_ERROR

**Message: Route not resolved, no server matched**

**Returned Status Code: `404`**

**Explanation:** This error occurs when the server validation is enabled, and the current request has **not** sent the current server or the provided one is not among the defined in the relative array in the file.

##### Example

```yaml
openapi: 3.0.0
paths:
  '/pet':
    get:
      responses:
        '200': {}
servers:
  - url: '{schema}://{host}/{basePath}'
    variables:
      schema:
        default: http
        enum:
          - http
          - https
      host:
        default: stoplight.io
        enum:
          - stoplight.io
          - dev.stoplight.io
      basePath:
        default: api
```

`curl "http://localhost:4010/pet?__server=http%3A%2F%2Finvalidserver.com"`

---

### NO_METHOD_MATCHED_ERROR

**Message: Route resolved, but no path matched**

**Returned Status Code: `405`**

**Explanation:** This error occurs when the current document has an endpoint with the requested URL, but the specified Verb is not listed.

##### Example

```yaml
openapi: 3.0.1
paths:
  /pets:
    get:
      responses:
        200:
          description: Hey
```

`curl -X POST http://localhost:4010/pets`

---

### NO_SERVER_CONFIGURATION_PROVIDED_ERROR

**Message: Route not resolved, no server configuration provided**

**Returned Status Code: `404`**

**Explanation:** This error occurs when a base URL has been provided in the current request (enabling the server validation feature) but the current document does not have any `servers` field/entry.

## Validation errors

This class of errors is returned when Prism is validating the request/response against the provided OpenAPI file.

### UNPROCESSABLE_ENTITY

**Message: Invalid request**

**Returned Status Code: `422`**

**Explanation:** This error occurs when the current request has not passed the validation rules specified in the current OpenAPI file _and_ the current resource is missing an error message (`422`, `400`, `default`). Note that this is an error _generated_ by Prism.

The `detail` field contains further information on the error (whether it's on the body, the headers or the query string).

---

### NOT_ACCEPTABLE

**Message: The server cannot produce a representation for your accept header**

**Returned Status Code: `406`**

**Explanation:** This error occurs when the current request has asked the response in a format that the current document is not able to produce.

##### Example

```yaml
openapi: 3.0.2
paths:
  /todos:
    get:
      responses:
        200:
          description: Get Todo Items
          examples:
            text/plain: hello
```

```
curl http://localhost:4010/todos -H "accept: application/json"`
```

---

### NOT_FOUND

**Message: The server cannot find the requested content**

**Returned Status Code: `404`**

**Explanation:** This error occurs when the current request is asking for a specific status code that the document is not listing or it's asking for a specific example that does not exist in the current document

### VIOLATIONS

**Message: Request/Response not valid**

**Returned Status Code: `500`**

**Explanation:** This error occurs when you're run Prism with the `--errors` flag and the request or the response has at least one violation marked as an error

---

## Security errors

This class of errors is returned when the current request is not satisfying the security requirements specified in the current resource

### UNAUTHORIZED

**Message: Invalid security scheme used**

**Returned Status Code: `401`**

**Explanation:** This error occurs when the security scheme for the current resource does not match the one that the one that the request being processed has provided.

---

## Negotiation errors

This class of errors is returned when anything goes wrong in between your **valid** request and returning a suitable response

### NO_COMPLEX_OBJECT_TEXT

**Message: Cannot serialise complex objects as text**

**Returned Status Code: `500`**

**Explanation:** This error occurs when the current request accepts the `text/*` as the response content type and Prism decided to respond with that, but the schema associated with the selected response of the operation generated a non primive payload and Prism has no idea how to serialise it.

##### Example

```yaml
openapi: '3.0.1'
paths:
  /:
    get:
      responses:
        200:
          content:
            text/plain:
              schema:
                type: object
                properties:
                  name:
                    type: string
                    example: Clark
                  surname:
                    type: string
                    example: Kent
```

`curl -X POST http://localhost:4010/ -A 'Accept: text/plain'`

### NO_RESPONSE_DEFINED

**Message: No response defined for the selected operation**

**Returned Status Code: `500`**

**Explanation:** This error occurs when the current request has matched a corresponding HTTP Operation and has passed all the validations, but there's no response that could be returned.

### INVALID_CONTENT_TYPE

**Message: Supported content types: _list_**

**Returned Status Code: `415`**

**Explanation:** This error occurs when the current request specifies a `Content-Type` that is not supported by corresponding HTTP Operation. In the case there is no request body or `Content-Length` is 0, the `Content-Type` header is ignored.

## Unknown error

In case you get an `UNKNOWN` error, it likely means we **screwed it up** and we haven't handled this particular edge case. If you encounter one of these, opening an [issue](https://github.com/stoplightio/prism/issues/new?labels=bug&template=bug_report.md) might be a good idea.
