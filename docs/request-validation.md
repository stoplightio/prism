# Request Validation

Requests to operations which expect a request body will be validated, for example: a POST with JSON.

```bash
curl -X POST -s -D "/dev/stderr" -H "content-type: application/json" -d '{"tag":"Stowford"}' http://127.0.0.1:4010/pets | json_pp
```

This will generate an error, conforming the [application/problem+json][rfc7807] specification:

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json
content-length: 274
Date: Thu, 09 May 2019 16:36:38 GMT
Connection: keep-alive

{
   "detail" : "Your request body is not valid: [{\"path\":[\"body\"],\"code\":\"required\",\"message\":\"should have required property 'name'\",\"severity\":0}]",
   "type" : "https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY",
   "title" : "Invalid request body payload",
   "status" : 422
}
```

This error shows the request is missing a required property `name` from the HTTP request body.
