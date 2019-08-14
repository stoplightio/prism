# Concepts

The term "mock" for a lot of developers will have unit-testing connotations. In
unit-testing, a mock is a fake implementation of a class or function, which
accepts the same arguments as the real thing. It might return something pretty
similar to expected output, and different test cases might even modify those
returns to see how the code under test works.

This is almost exactly the concept here, just at a HTTP level instead. This is
done using a "mock server", which will respond to the expected endpoints, error
for non-existent endpoints, often even provide realistic validation errors if a
client sends it an invalid request.

Prism can be given an [OpenAPI](https://www.openapis.org/) v2/v3 description
document in order to build the mock server, then it can do all sorts of clever stuff.

## Request Validation

Having a mock server which only gave responses would not be very useful, what about HTTP requests? Well, seeing as your OpenAPI description document is full of all sorts of validation rules like type, format, max length, etc., Prism can easily provide [request validation](../guides/request-validation.md) too. 

## Response Generation

- Static (default)
- Dynamic

Prism will use whatever examples are provided in order to create responses when running in static mode, and dynamic mode will create random responses based on the information it has available. Responses are a huge topic, so read up our guide on [mocking responses](../guides/mock-responses.md).
