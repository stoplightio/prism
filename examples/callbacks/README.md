# Mocking Callbacks with Prism

This example shows how Prism mocks callbacks.

## Environment setup

Start service exposing `/subscribe` callback (referred as `4010`)

```bash
prism mock -p 4010 service.oas3.yaml
``` 

Start service exposing `/notify` operation used for receiving callback requests (referred as `4011`)

```bash
prism mock -p 4011 client.oas3.yaml
``` 

## Run!

Subscribe to callback

```bash
curl -v -H'Content-type: application/json' -d'{ "url": "http://localhost:4011/notify", "token": "ssecurre" }' http://127.0.0.1:4010/subscribe
```

Now, the console for `4010` service should show:
```$xslt
[HTTP SERVER] post /subscribe ℹ  info      Request received
    [NEGOTIATOR] ℹ  info      Request contains an accept header: */*
    [VALIDATOR] ✔  success   The request passed the validation rules. Looking for the best response
    [NEGOTIATOR] ✔  success   Found a compatible content for */*
    [NEGOTIATOR] ✔  success   Responding with the requested status code 202
    [CALLBACK] ℹ  info      actions: Making request to http://localhost:4011/notify?token=ssecurre...
    [CALLBACK] ℹ  info      actions: Request finished
```

The console of `4011` service:

```
[HTTP SERVER] post /notify ℹ  info      Request received
    [NEGOTIATOR] ℹ  info      Request contains an accept header: */*
    [VALIDATOR] ✔  success   The request passed the validation rules. Looking for the best response
    [NEGOTIATOR] ✔  success   Found a compatible content for */*
    [NEGOTIATOR] ✔  success   Responding with the requested status code 200
```

After subscribing via `/subscribe`, Prism successfully invoked `/notify` callback with mocked payload.
