# CORS

By default, Prism will handle all the [preflight requests](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) responding with a `204` and with headers that will allow all the methods and all the origins.

This is regardless of your OpenAPI description. A request to `OPTIONS /api/todo` will receive a `204` as a response even though your description document does not specify the `OPTIONS` verb for that endpoint, **and** even if your description document does **not** have an `/api/todo` path at all.

In case your OpenAPI Document specifies an `OPTIONS` handler (returning a custom status code or different headers) it will still be called when the subsequent `OPTIONS` request will be made. This is because Prism is able to differentiate between a preflight request and a regular `OPTIONS` request.

You can disable the default CORS handler with a command line flag (`prism mock document.yml --cors=false`). In that case, you are in complete control of the response for all the preflight request, and you can decide which header you want to return.
