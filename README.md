## Introduction

This is a fork of [prism](https://github.com/stoplightio/prism).

## Setup

```
yarn build --clean
```

build docker image

```
cd ${rootPath}
docker image -t <image-name> .
```

start image

```
docker run --rm -p 9003:4010 -t openprism:demo mock -h 127.0.0.1 /tmp/specification/storage/resource-manager/Microsoft.Storage/stable/2021-08-01/storage.json
```

or

```
docker run --rm -p 9003:4010 -t openprism:demo mock -h 127.0.0.1 https://raw.githubusercontent.com/1openwindow/openprism/master/examples/petstore.oas2.yaml
```

## 🎉 Thanks

Prism is built on top of lots of excellent packages, and here are a few we'd like to say a special thanks to.

- [prism](https://github.com/stoplightio/prism)
- [ajv](https://www.npmjs.com/package/ajv)
- [faker](https://www.npmjs.com/package/faker)
- [fp-ts](https://www.npmjs.com/package/fp-ts)
- [gavel](https://www.npmjs.com/package/gavel)
- [json-schema-faker](https://www.npmjs.com/package/json-schema-faker)
- [lerna](https://www.npmjs.com/package/lerna)
- [micri](https://www.npmjs.com/package/micri)
- [openapi-sampler](https://www.npmjs.com/package/openapi-sampler)
- [yargs](https://www.npmjs.com/package/yargs)
