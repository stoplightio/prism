# Concepts

Prism is a CLI and TypeScript toolkit for various bits of HTTP and API Description
functionality. 

- [Mocking](#mocking)
- [Validation Proxy](#validation-proxy)

Learn what these things mean below.

## Mocking

The term "mock" for a lot of developers will have unit-testing connotations. In
unit-testing, a mock is a fake implementation of a class or function, which
accepts the same arguments as the real thing. It might return something pretty
similar to expected output, and different test cases might even modify those
returns to see how the code under test works.

This is almost exactly the concept here, just at a HTTP level instead. This is
done using a "mock server", which will respond to the expected endpoints, error
for non-existent endpoints, often even provide realistic validation errors if a
client sends it an invalid request.

Prism can be given an [OpenAPI](https://www.openapis.org/) v2 or v3 description
document, which is essentially a data source for all the decisions Prism makes.

<!-- theme: info -->
> Seeing as this is a HTTP server run from the command-line, Prism is not yet the 
tool you'll want to use for programatic mocking in your test-suites. This is 
planned for the future, so get in touch if you're interested in helping us with this.

Read more about this in our [mocking guide](../guides/01-mocking.md).

## Validation Proxy

Mocking helps when there is no real API, and helps API consumers feel confident they're 
building applications that will work with the API properly. Then, when the API has been built, 
Prism can continue to help by proxying requests to the real server and reporting if anything is different. 

Running Prism on the [CLI](./03-cli.md) with `prism proxy openapi.yml http://api.example.com/` 
will run a HTTP server similar to the mock, and it will use the same
[request validation](../guides/02-request-validation.md) logic as the mock server. 

If the request is valid, it will make the same request to the upstream server provided in 
the CLI, and return its response. At this point, if the response is invalid against the API 
description provided, it can also error. 

Basically, if the consumer makes an invalid request, or the server makes an invalid response, 
Prism will let you know about it. It can log it, or blow up with errors, you decide which 
is useful for your use case.

Read more about this in our [validation proxy guide](../guides/03-validation-proxy.md).

## Further Reading

Both the mock server and the validation proxy server are primarily used via the
[command-line interface](./03-cli.md).
