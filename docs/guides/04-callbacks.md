# Mocking Callbacks with Prism

## What are callbacks?

Callback in OpenApi 3 defines an outgoing, asynchronous request that your service will make to some other service. Typical real-life example is a code repository. You can subscribe to certain events on a repo (like commit or tag) and your api will start receiving notifications for those events. Another example is one-time notifications. You can subscribe to a `invoice paid` event and a callback will be invoked when such payment is processed.

##### Sources:

- [Callback Docs](https://swagger.io/docs/specification/callbacks/)
- [Callback Object Specification](https://spec.openapis.org/oas/v3.0.2#callbackObject)

## The Example

This example shows how Prism mocks callbacks. There are two services defined: `payment-service` and `client-service`. `payment-service` exposes a subscribe-to-invoice-events method. Client service defines a notification reception endpoint. Our goal is to programmatically subscribe to events about certain invoice.

### Environment setup

Start `payment-service` exposing `/subscribe` callback.

```bash
prism mock -p 4010 examples/callbacks/payment-service.oas3.yaml
```

Start `client-service` exposing `/notify` operation used for receiving callback requests.

```bash
prism mock -p 4011 examples/callbacks/client-service.oas3.yaml
```

### Run!

Subscribe to callback

```bash
curl -v -H'Content-type: application/json' -d'{ "url": "http://localhost:4011/notify", "token": "ssecurre" }' http://127.0.0.1:4010/invoices/123/subscribe
```

Now, the console for `payment-service` should contain:

```
[HTTP SERVER] post /invoices/123/subscribe ℹ  info      Request received
    [NEGOTIATOR] ℹ  info      Request contains an accept header: */*
    [VALIDATOR] ✔  success   The request passed the validation rules. Looking for the best response
    [NEGOTIATOR] ✔  success   Found a compatible content for */*
    [NEGOTIATOR] ✔  success   Responding with the requested status code 202
    [CALLBACK] ℹ  info      actions: Making request to http://localhost:4011/notify?token=ssecurre...
    [CALLBACK] ℹ  info      actions: Request finished
```

The console of `client-service`:

```
[HTTP SERVER] post /notify ℹ  info      Request received
    [NEGOTIATOR] ℹ  info      Request contains an accept header: */*
    [VALIDATOR] ✔  success   The request passed the validation rules. Looking for the best response
    [NEGOTIATOR] ✔  success   Found a compatible content for */*
    [NEGOTIATOR] ✔  success   Responding with the requested status code 200
```

After subscribing via `/subscribe`, Prism successfully invoked `/notify` callback with mocked payload.

## Limitations

- no support for `servers` and `security` definitions inside callback operation
- no support for `$url` and `$request.path.*` runtime expressions
