# Validation Proxy

Unlike mocking, the validation proxy expects there to be a real API running somewhere. This could be a localhost environment, docker container, hosted sandbox environment, or deployed to actual production, doesn't matter.

The proxy feature will help you identify discrepancies between the OpenAPI document (supposedly the source of truth) and any other server you designate as the target. This can help frontend developers integrating with your API, or other backend developers, who might want to channel their requests through Prism to see if they are making valid requests. The proxy can also be enabled in staging or any other pre-production environment, like a dress rehearsal before the opening night of a play.

## Use Cases

Let's look at some of these use-cases.

### Assisting API Consumer Integration

In the [design-first workflow](https://www.apisyouwonthate.com/blog/api-design-first-vs-code-first/), mocking gives your team something to use before the API exists. Then, when enough feedback has come in and the API developers have decided to start coding the API, the hope is that the real API matches the mock API. If it matches perfectly, the existing development work done by the API consumers during the feedback stage means that integrating the real API should involve little to no work. Sadly, subtle differences often go unnoticed, with properties changing slightly, or being removed completely. 

As of Prism v3.2, API consumers can funnel their development traffic through Prism running as proxy, and then relay that traffic to the API-in-progress. It will report any mistakes it notices along the way, either with the requests you're sending or the responses coming back from the server.

In this use case, the OpenAPI documents would be provided by the API team, distributed to the API consumers, and the proxy server would be pointing to the dev environment. We'd also want to enable `--errors` so Prism will blow up your request if a mismatch is noticed.

```bash
prism proxy reference/backend/openapi.yaml localhost:3000 --errors
```

### End-to-End Contract Testing 

Before the design-first workflow, folks would often slap together their own API descriptions, often by hand, and often just eyeballing it for correctness. Various tools came and went for trying to test the correctness of their API decription documents, but they were often awkward flaky test-suites that people ended just turning off. Adding contract
testing to existing test-suites is now easy with Prism.

Teams with existing end-to-end test-suites can drop Prism into this testing environment, and change some environment variables (or service catalog) to point to Prism Proxy. Each time API A talks to API B, or B to C, it will be going via C, so if any of the APIs make an invalid request the whole test suite can blow up.

```bash
prism proxy reference/api-a/openapi.yaml api-a-test.example.com --errors -p 5000
prism proxy reference/api-a/openapi.yaml api-b-test.example.com --errors -p 5001
prism proxy reference/api-a/openapi.yaml api-c-test.example.com --errors -p 5002
```

This adds contract testing to an existing test suite for very little work, regardless of the language your APIs are written in, without any changes required to the codebases.

### Live Contract Testing

Now you can use Prism to test traffic against the API description. This could be done in development as we've mentioned, but it could also be placed in staging, QA, or some sort of pre-production environment. Probably keep it out of production, because even though Prism is quick like a fox, introducing _anything_ to the criticl path of your API is probably not what you want.

<!-- theme:info -->
> Future versions of Prism will include ways to sniff existing traffic, without requests being made directly to it. sniffing nginx logs, or piping other forms of traffic through. [Get in touch with ideas](https://github.com/stoplightio/prism/issues/955).

