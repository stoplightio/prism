# Examples Generation

Prism will try to generate meaningful examples for all the responses and use some fallback mechanisms in case the generation was not possible. This document outlines how the process works so that you will understand why Prism has responded with such example.

By default, Prism will use a **static generation strategy**, which is outlined below. You can enable the dynamic examples generation by using the `-d` flag in the command line.

`prism mock api.oas3.yaml` -> Static example generation

`prism mock -d api.oas3.yaml` -> Dynamic example generation

## Foreword

We will assume you're already familiar with the mocking flow. In case you're not, you can consult [our diagram][diagram]. This document describes fundamentally what happens once we have enough data to return a meaningful payload (aka: the last green circle).

When the negotiator has sorted out the response to return to the client and has selected the appropiate `content` according to the `Accept` header, but there's no element nor in the `example` property nor in the `examples` one, then the example generation kicks in.

Both Dynamic and Static generation almost follow the same path, which forks in the final behaviour in case anything else fails.

## Static Example Generation

1. If the provided OpenAPI Schema Object has an example for the whole object, it will return such value (or the first one in case it is an array)
2. If not, for each property
  * If the property has a default value, then it will return the specified value
  * If the property has an `examples` value, then it will return the first element in the array
  * If the property has nor an example or a default value and it's **nullable**, it will return null
  * If the property has nor an example or a default value and it's **not** nullable, and has a `format` specified it will return a meaningful static value according to the format
  * If the property has nor an example or a default value and it's **not** nullable, and has not a `format` specified it will return `'string'` in case of a number and `0` in case of a string

As you probably noticed, the Static Example Generation strategy is fundamentally going through the description and try to assemble a static example using all the avaiables sources of data. This means that the better your document is, the better the static example will be.

## Dynamic Example Generation

Prism will generate a random value for all the properties according to the type, regardless of the examples presence or not. You will still be able to manually select a specific example you want to get back in case it's required through the `__example` query parameter. All the generated properties will take in consideration the `format` property, in case it's provided.

### Improving Dynamic Examples with Faker Extension

In case you're using dynamic examples, you can instruct with a simple extension what kind of data you're looking for, even if the official OpenAPI Schema Object does not support such values, using the `x-faker` property.

You can use any of the [supported API Methods][fakerjs]

```json
{
  "type": "object",
  "properties": {
    "ip": {
      "type": "string",
      "format": "ipv4",
    }
  },
  "required": [
    "ip"
  ]
}
```

This will make sure Prims will generate random ip addresses instead of strings

[diagram]: ./packages/http/docs/images/mock-server-dfd.png
[fakerjs]: https://github.com/marak/Faker.js/
