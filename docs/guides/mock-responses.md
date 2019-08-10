# Mock Responses

Prism will try to return meaningful responses based on whatever information it has available, like response examples, and use various fallback mechanisms in case no examples were provided. This means any OpenAPI description document can be used with no extra work, but better documents provide better results.

The first thing to understand is that the Prism HTTP Server respects [Content Negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation). If your API is a mixture of JSON, XML and form data, you can use `Accept`
and `Content-Type` just like with a real API, and it should work as expected, or fail if you request non-existent types.

## Response Examples

If a response has an example, it will be used for the response. If there are multiple examples then they can be selected by name. Let's take a look part of an OpenAPI description, this is an operation with a response that has a 200 OK and multiple examples:

```yaml
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          "$ref": "#/components/schemas/Pet"
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

Changing the URL to `http://127.0.0.1:4010/pets/123?__example=dog`

```json
{
    "id": 2,
    "name": "Spot",
    "photoUrls": [
      "https://images.dog.ceo/breeds/kelpie/n02105412_893.jpg"
    ]
}
```

## Static or Dynamic Generation

By default, Prism will use a **static generation strategy**, which is outlined below. You can enable the dynamic examples generation by using the `-d` flag in the command line.

```yaml
prism mock api.oas3.yaml # Static examples

prism mock -d api.oas3.yaml # Dynamic examples
```

If the HTTP server has been started in static mode, specific calls can be made in dynamic mode by appending `?__dynamic=true` to any URL.

### Static Response Generation

If the provided OpenAPI Schema Object has a response body example then it'll use that whole thing.

If not, an response body will be created by looking through the whole `schema` object (following any `$ref`'s it finds along the way) to create a full fake response.

* If the property has a default value, then it will return the specified value
* If the property has an `examples` value, then it will return the first element in the array
* If the property has nor an example or a default value and it's **nullable**, it will return null
* If the property has nor an example or a default value and it's **not** nullable, and has a `format` specified it will return a meaningful static value according to the format
* If the property has nor an example or a default value and it's **not** nullable, and has not a `format` specified it will return `'string'` in case of a number and `0` in case of a string

Let's try an example! 🐶

This is a schema component found in our OpenAPI description document:

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

When we call `curl http://127.0.0.1:4010/pets/123`, the operation references this component so we get a doggie:

```json
{
    "id": 0,
    "name": "doggie",
    "photoUrls": [
        "string"
    ]
}
```

Notice that `name` had an `example` with a value so Prism used it, but `photoUrls` did not, so it just returned `"string"`. 🤷‍♂️

### Dynamic Response Generation

Testing against the exact same piece of data over and over again is not the best way to build a robust integration. What happens when a name is longer than you expected, or the value happens to be 0 instead of 6?

Dynamic mode solves this by generating a random value for all the properties according to their type, and other information like `format` or even the all-powerful `x-faker` extension.

All the random properties are generated using [Faker.js](https://github.com/marak/Faker.js) under the hood, via [JSON Schema Faker](https://github.com/json-schema-faker/json-schema-faker). The `x-faker` keyword is optional, but when present allows for a specific Faker API method to be used (of which there [are a lot](https://github.com/marak/Faker.js#api-methods)) so you get a lot of control over the response.

```yaml
  Pet:
    type: object
    properties: 
      id: 
        type: integer
        format: int64
      name: 
        type: string
        x-faker: name.firstName
        example: doggie
      photoUrls: 
        type: array
        items: 
          type: string
          x-faker: image.imageUrl
```

When we call `curl http://127.0.0.1:4010/pets/123?__dynamic=true`, the operation references this component so we get a doggie:

```json
{
    "id": 12608726,
    "name": "Addison",
    "photoUrls": [
        "http://lorempixel.com/640/480",
        "http://lorempixel.com/640/480",
        "http://lorempixel.com/640/480",
        "http://lorempixel.com/640/480"
    ]
}
```

The more descriptive your description is, the better job Prism can do at creating a mock response. 

_**Tip:** If your team needs help creating better quality API description documents, take a look at [Spectral](https://stoplight.io/spectral/). You could enforce the use of `example` properties, or similar._
