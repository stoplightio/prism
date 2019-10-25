# Test Harness

## Prerequisites

- Install the project dependencies with `yarn`
- Generate the binary for your platform with `yarn build.binary`. This will _also_ compile the project from TS -> JS

## Running the suite

Run `yarn test.harness` from your terminal

### Running a selected tests

You can run one or selected tests using `TESTS` env variable.
If you want multiple test files to be run separate them with commas.
Use paths relative to the `./spec` directory.

E.g. run `TESTS=parameters-ac1.oas2.txt,validate-body-params/form-byte-format-fail.oas2.txt yarn test.harness`

### Matching test files

All test files are matched using a glob `**/*.txt`.
This means that you can:

- nest test files in subdirectories
- skip files by suffixing name with `.skip` or some other suffix.

## Adding a new test

- Create a new file in the `./spec` directory. It can have _any_ name and _any_ extension, it does not really matter.
- Use the following template and put your stuff:

```
====test====
Test text, can be multi line.
====spec====
openapi 2/3 document
====server====
command line arguments to run Prism with. You have to use the ${document} template variable.
====command====
curl command to get the response
====expect====
expected output from curl
```

### A real example?

```
====test====
Hello
====spec====
openapi: 3.0.2
paths:
  /todos:
    get:
      responses:
        200:
          description: Get Todo Items
          content:
            'application/json':
              example: hello
====server====
mock -p 4010 ${document}
====command====
curl -i -X GET http://localhost:4010/todos -H "accept: application/json"
====expect====
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 7
Date: Fri, 21 Jun 2019 09:25:34 GMT
Connection: keep-alive

"hello"
```

#### Things to keep in mind when creating the files:

- 1 scenario per file.
- Be precise with the separators. They should be 4 _before_ **AND** _after_ the word. `====`
- The 6 keywords are `test,spec,server,command,expect,expect-loose`, nothing else at the moment
- You can run all the tests on the same port `4010`, but you can also choose another one
- The `curl` command does not support piping stuff into other tools; so if you're trying to be cool and do `curl | grep`, well maybe next time.
- All the `curl` commands **must** have the `-i` flag, otherwise the trace parser won't understand the output
- Some of the harness test are relying on an instance of httpbin working locally on your computer and responding on the `http://httpbin` address. You can easily do that using the `kennethreitz/httpbin` docker image

## Technical details

- A RegExp is used to split the content
- A temporary file with the specification file is stored on your disk
- Prism gets spawn with the specified arguments and waited to be running
- The curl command is performed
- The outputs get converted using `http-string-parser`, a veeery old package transforming curl output to a consumable format
- Gavel is used to validate the request — it will automagically ignore headers that can change and consider only the "fundamental" one such as content negotiation ones and stuff around.
