# HTTP Mocking

Prism's HTTP mock server simulates a real web API by providing endpoints and validation rules described in your API description document. This allows client developers to begin writing code for frontend services like web, mobile, or other backend applications, while API developers are still writing code. This can help find and solve problems early on, before the API is built, because changing all that code can be expensive.

- Does the API contain the information the client needs?
- Is that data in the format the client needs?
- Are the resources too "normalized" and data-centric (instead of being use-case centric) that the client has to make 3292375 calls to get all the data they need?
- Is there enough time left for feedback to be implemented?
- If the feedback spawns large enough work, will the client have time to implement this API once it's done?

You can avoid these problems by getting a free API to play with without spending a month building it all.

Catching problems early on while you're still just tweaking the API descriptions (maybe using [Stoplight Studio](https://stoplight.io/studio)), means you can avoid making costly changes to the production API, deprecating old things, or creating whole new global versions which add a huge workload to every single client.

Just like HTTP messages, there are two halves to mocking: requests and responses.

- [Response Generation](#response-generation)
- [Request Validation](#request-validation)

## Response Generation

Prism will try to return meaningful responses based on whatever information it has available, like response examples, and use various fallback mechanisms in case no examples were provided. This means any OpenAPI description document can be used with no extra work, but better documents provide better results.

The first thing to understand is that the Prism HTTP Server respects [Content Negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation). If your API is a mixture of JSON, XML and form data, you can use `Accept`
and `Content-Type` just like with a real API, and it should work as expected, or fail if you request non-existent types.

### Prism Decision Engine

Prism responses are based on the following decision diagram.

```mermaid
flowchart TB
    1A[HTTP Request] --> 1B{Route exists?}
    1B -->|No| 1C[404 problem+json]
    1B -->|Yes| 1D{Is request valid?}
    1D -->|Yes| 1E[Negotiate for valid request]
    1E--> 1G{Status code enforced?}
    1G -->|No| 1H[Negotiate for lowest 2XX response]
    1G -->|Yes| 1I[Negotiate for status code]
    1H --> 1J{Take lowest 2XX response}
    1J -->|Yes<br>status code=2xx| 1X[Negotiate for a<br>given response]
    1X -->1M 
    1J -->|No 2XX defined| 1K[500 problem+json]
    1L -->1M{Success?}
    1M -->|Yes| 1N[Status code<br>media type]
    1M -->|No| 1H[Negotiate for lowest 2XX response]
    1I --> 1O{Response for<br>status code exists?}
    1O -->|Yes| 1L
    1O -->|No| 1P{Default response exists?}
    1P -->|Yes<br>status code=default| 1L[Negotiate for a<br>given response]
    1P -->|No| 1Q[500 problem+json]
    1X -...-> 3A
    1D -->|No| 2A[Negotiate for invalid request]
    2A[Negotiate for invalid request] --> 2B{Is error security-related?}
    2C -->|No| 2I[500 problem+json]
    2B -->|Yes| 2C{401 exists?}
    2C -->|Yes| 2E{Take example by key<br>or take first}
    2B -->|No| 2D[Is 415 error and exists?]
    2D -->|Yes| 2E
    2D -->|No| 2F{422 exists?}
    2F -->|Yes| 2E
    2F -->|No| 2G{400 exists?}
    2G -->|Yes| 2E
    2G -->|No| 2H{Default exists?}
    2H -->|Yes| 2E
    2H -->|No| 2M[500 problem+json]
    2E -->|No example defined| 2K{Take first schema}
    2E -->|Yes, exists<br>media type=example's media type<br>content=example| 2L[422 or400<br>media type]
    2K -->|No schema defined| 2J[500 problem+json]
    2K -->|Yes, exists<br>media type=example's media type<br>content=schema| 2L
    1L -...-> 3A
    3A{Media type enforced?} -->|No| 3B[Negotiate for a<br>default media type]
    3A -->|Yes| 3C{Media type<br>content exists?}
    3B --> 3C
    3C --> 3D[Negotiate for a given content]
    3C -->|No<br>empty| 3E[Status code<br>text/plain]
    3D --> 3F{Example<br>enforced?}
    3F -->|No| 3J{Dynamic<br>forced?}
    3F -->|Yes| 3G{Example exists?}
    3J -->|No| 3K{Any<br>example<br>exists?}
    3K -->|Yes<br>example| 3I[Status code<br>media type]
    3K -->|No| 3L{Has schema?}
    3L -->|No<br>empty| 3I
    3J -->|Yes| 3M{Schema<br>exists?}
    3M -->|Yes<br>schema| 3I
    3L -->|Yes<br>schema| 3I
    3M -->|No| 3H[500 problem+json]
    3G -->|Yes| 3N[Status code<br>media type]
    3G -->|No| 3O[500 problem+json]
classDef Orange fill:#f58442
classDef Green fill:#42f572
classDef Red fill:#EE7968
class 1A,1B,1D,1E,1F,1G,1H,1I,1J,1M,,1O,1P,2A,2B,2C,2D,2E,2F,2G,2H,2I,2K,3A,3B,3C,3D,3F,3G,3J,3K,3L,3M Orange
class 1C,1K,1Q,2I,2J,2M,3H,3O Red
class 1L,1N,1X,,2L,3E,3I,3N Green
```

### Response Examples

If a response has an example, it will be used for that response. If there are multiple examples, then they can be selected by name. In the following OpenAPI description, the operation has a 200 OK response and multiple examples:

```yaml
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          '$ref': '#/components/schemas/Pet'
        examples:
          cat:
            summary: An example of a cat
            value:
              id: 2
              name: Fluffy
              photoUrls: []
          dog:
            summary: An example of a dog
            value:
              id: 1
              name: Spot
              photoUrls:
                - https://images.dog.ceo/breeds/kelpie/n02105412_893.jpg
```

Calling `curl http://127.0.0.1:4010/pets/123` on this will give:

```json
{
  "id": 2,
  "name": "Fluffy",
  "photoUrls": []
}
```

Calling the same URL with the `Prefer` header `example=dog` `http://127.0.0.1:4010/pets/123` will yield to:

```json
{
  "id": 1,
  "name": "Spot",
  "photoUrls": ["https://images.dog.ceo/breeds/kelpie/n02105412_893.jpg"]
}
```

<!-- theme: info -->

> #### Remember to provide an expected response code
>
> It's always worth indicating the HTTP response code from which `example` should be taken. If Prism decides to change the response code due to validation or security violations, your `example` might be ignored.

### Static or Dynamic Generation

By default, Prism uses a **static generation strategy**, which is outlined below. You can enable the dynamic examples generation by using the `-d` flag in the command line.

```yaml
prism mock api.oas3.yaml # Static examples

prism mock -d api.oas3.yaml # Dynamic examples
```

If the HTTP server has been started in static mode, specific calls can be made in dynamic mode by specifying the `Prefer` header with the `dynamic` key set to `true`.

#### Static Response Generation

If the provided OpenAPI Schema Object has a response body example, it's used to provide a response.

If not, a response body will be created by looking through the whole `schema` object (following any `$ref`'s it finds along the way) to create a full fake response.

- If the property has a default value, then it will return the specified value.
- If the property has an `examples` value, then it will return the first element in the array.
- If the property has neither an example nor a default value and **is nullable**, it will return null.
- If the property has neither an example nor a default value and **isn't nullable**, but has a `format` specified, then it will return a meaningful static value according to the format.
- If the property has neither an example nor a default value, isn't nullable, and has no `format` specified, then it will return `'string'` in case of a string and `0` in case of a number.

For example, this is a schema component found in an OpenAPI description document:

```yaml
Pet:
  type: object
  properties:
    id:
      type: integer
      format: int64
    name:
      type: string
      example: doggie
    photoUrls:
      type: array
      items:
        type: string
```

When you call `curl http://127.0.0.1:4010/pets/123`, the operation references this component and a `doggie` is returned:

```json
{
  "id": 0,
  "name": "doggie",
  "photoUrls": ["string"]
}
```

Notice that `name` had an `example` with a value so Prism used it, but `photoUrls` didn't, so it just returned `"string"`.

Users also have the option to use the command-line flag `--ignoreExamples`. When present, and in static mode, the flag tells Prism to treat the spec as if it doesn't have any response examples defined. In this case, Prism continues to do what it already does in static mode when no response example are present, which is to return an example that has not been generated using json-schema-faker, but was created by Prism (it replicates the behavior of the situation just above where no response examples are given in the schema). However, when the `--ignoreExamples` flag is present, and in dynamic mode, the flag is essentially ignored, since in dynamic mode, examples are not consulted and json-schema-faker is used to generate a response based on the schema defined in the spec.

#### Dynamic Response Generation

Testing against the exact same piece of data over and over again isn't the best way to build a robust integration. What happens when a name is longer than you expected, or the value happens to be 0 instead of 6?

Dynamic mode solves this by generating a random value for all the properties according to their type, and other information like `format` or even by using the Faker library.

Read more about how to use Faker in [Dynamic Response with Faker](./11-dynamic-response-with-faker.md).

## Request Validation

Having a mock server that only gives responses would not be useful, which is why Prism imitates request validation too. An OpenAPI description document is full of validation rules like type, format, max length, etc. Prism can validate incoming messages and provide validation feedback if it receives invalid requests.

Read more about this in the [Prism Request Validation guide](./02-request-validation.md).

## Deprecating operations

If an operation is marked as `deprecated: true` then Prism adds `Deprecation: true` header to the response.
