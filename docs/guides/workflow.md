# Workflow

Having a mock server can be really handy throughout the design phase of an API for making sure API descriptions contain the right sort of information.

Prism's HTTP server simulates a real web API by providing endpoints and validation rules described in your API description document. This allows client developers to begin writing code for frontend services like web, mobile, or other backend applications, whilst the API developers are still writing their code. This can help find and solve problems early on, before the API is built, because changing all that code can be expensive (time is money).

- Does the API contain the information the client needs?
- Is that data in the format the client needs?
- Are the resources too "normalized" and data-centric (instead of being use-case centric) that the client has to 3292375 calls to get all the data?
- Is there enough time left for feedback to be implemented?
- If the feedback spawns large enough work, will the client have time implement this API once it's done?
- Avoid all of these problems by getting a free API to play with without spending a month building it all.

Catching problems early on while you're still just tweaking the API descriptions (maybe using [Studio][studio]), means you can avoid making costly changes to the production API, deprecating old things, or creating whole new global versions which add a huge workload to every single client.

[studio]: https://stoplight.io/studio