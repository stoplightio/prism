# Dynamic Response Generation with Faker

When testing API calls, it's helpful to have dynamically generated responses to make sure your applications supports several use cases, instead of just testing with the same static piece of data over and over.

Prism uses the [Faker](https://github.com/faker-js/faker) and [JSON Schema Faker](https://github.com/json-schema-faker/json-schema-faker) libraries to help with that.

> Make sure you're running Prism in dynamic mode using the `-d` flag, or using the `Prefer` header with the `dynamic` key set to `true`.

## How It Works

In your OpenAPI description, you can pass in the `x-faker` keyword to a property, which allows for a specific Faker API method to be used.

If a user passes a method that doesn't exist, Prism falls back to using [JSON Schema Faker](https://github.com/json-schema-faker/json-schema-faker) to generate random values for that property.

For example, here's how you can use the `name.firstName` and `image.imageUrl` Faker methods:

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

Making the call `curl http://127.0.0.1:4010/pets/123 -H "Prefer: dynamic=true"`, the operation references this component and a doggie is returned with random values for `name` and `photoUrls`:

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

The more descriptive your properties are, the better job Prism can do at creating a mock response.

<!-- theme: info -->
> **Tip:** If your team needs help creating better quality API description documents, take a look at [Spectral](https://stoplight.io/spectral/). You could enforce the use of `example` properties, or similar.

## Faker Supported Methods
 
For a list of supported methods, you can check [Faker's v6 documentation portal](https://v6.fakerjs.dev/api/address.html).

It's important to note that Faker's version, and how you're using Prism, can have an impact on the behavior you might see. The current version of Faker that Prism is using is set to `^6.0.0`, and can be found in Prism's [package.json file](https://github.com/stoplightio/prism/blob/master/packages/http/package.json#L19). That means that any Faker version between v6.0.0 and v6.3.1 is valid for running Prism. If a user has a local version of Faker installed that's v6.0.0, while another user has v6.3.1 installed, when running the same OpenAPI description through Prism they might see different responses.

You can check which version of Faker you have installed locally by running the following command and looking for `@faker-js/faker`:

```bash
yarn list --depth 0
```

It's also worth noting that JSON Schema Faker also uses its [own version of the Faker library](https://github.com/Shinigami92/json-schema-faker/blob/master/package.json#L87), so the behavior you might see from the fallback methods can also be affected by it.

## Control Generated Fakes for Individual Properties

In the following example there are two properties, each with specific Faker parameters. [`datatype.number`](https://v6.fakerjs.dev/api/datatype.html#number) uses named parameters while [`helpers.slugify`](https://v6.fakerjs.dev/api/helpers.html#slugify) uses positional parameters. 

```yaml
example:
  type: object
  properties:
    ten-or-eleven:
      type: number
      example: 10
      x-faker:
        datatype.number:
          min: 10
          max: 11
    slug:
      type: string
      example: two-words
      x-faker:
        helpers.slugify: [ "two words" ]
```

Pay close attention to the Faker docs when configuring any methods you pass in to the `x-faker` property. Some methods, such as `datatype.number`, will take in named options parameters:

```yaml
x-faker:
  datatype.number:
    min: 10
    max: 11
```

While other methods, such as `finance.amount`, will take in an array:

```yaml
finance.amount:
  - 100
  - 10000
  - 2
  - '$'
```

If you're working with [dates](https://v6.fakerjs.dev/api/date.html), they're not a supported JSON Schema type, so JSON Schema Faker will return them as a string. For example, for this object:

```yaml
due_date:
  type: string
  x-faker: date.past
```

The output is:

```json
"due_date": "Tue Sep 14 2021 05:34:08 GMT-0500 (Central Daylight Time)",
```

If you'd like to change the date string format, you can pass in `format` property in the schema. For example:

```yaml
due_date:
  type: string
  x-faker: date.past
  format: "date-time"
```

And the output will be:

```json
"due_date": "2021-11-18T00:00:00.0Z",
```

## Configure JSON Schema Faker

JSON Schema Faker has a set of [default configuration options](https://github.com/json-schema-faker/json-schema-faker/tree/master/docs#available-options). Prism has a [few options](https://github.com/stoplightio/prism/blob/master/packages/http/src/mocker/generator/JSONSchema.ts#L51) that are set to different values than the default configuration options, namely:

```js
failOnInvalidTypes: false, // if enabled, it will throw an Error for unknown types
failOnInvalidFormat: false, // if enabled, it will throw an Error for unknown formats
alwaysFakeOptionals: true, //  when enabled, it will set optionalsProbability: 1.0 and fixedProbabilities: true
optionalsProbability: 1, // a value from 0.0 to 1.0 to generate values in a consistent way, e.g. 0.5 will generate from 0% to 50% of values. Using arrays it means items, on objects they're properties, etc.
fixedProbabilities: true, // if enabled, then optionalsProbability: 0.5 will always generate the half of values
ignoreMissingRefs: true, // if enabled, it will resolve to {} for unknown references
```

At the top level of your API Specification, you can create an `x-json-schema-faker` object containing a map of [JSON Schema Faker Options](https://github.com/json-schema-faker/json-schema-faker/tree/master/docs#available-options) and their values. An additional `locale` option is accepted to configure the `locale` of the underlying Faker instance.

The only option that is not supported is `random`, since that takes in a function.

```yaml
openapi: 3.1.0

x-json-schema-faker:
  locale: de
  min-items: 2
  max-items: 10
  optionalsProbability: 0.5
  resolve-json-path: true
```

### Fill or Additional Properties

By default, `fillProperties` (*additional properties* in OpenAPI) are enabled. When `fillProperties = true`, the JSON Schema Faker generates missing properties to fulfill the schema definition. 

To set `fillProperties` to `false`, use one of the following options:  

- **CLI:** Run `prism mock -d --json-schema-faker-fillProperties=false api.oas3.yaml`. Setting this value with the CLI takes priority over the value set in `x-json-schema-faker`
- **Schema:** Add a `x-json-schema-faker` object at the top level of your schema.

```yaml
openapi: 3.1.0
x-json-schema-faker:
   min-items: 2
   max-items: 3
   fillProperties: false
```