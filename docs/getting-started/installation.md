# Installation

For many, the easiest way to install Prism is as a node module.

```bash
npm install -g @stoplight/prism-cli
# or
yarn global add @stoplight/prism-cli
```

## Executable binaries

For users without Node and/or NPM/Yarn, we provide standalone packages for [all major platforms](https://github.com/stoplightio/prism/releases). The quickest way to install the appropriate package for your operating system is via this shell script:

```bash
curl -L https://raw.githack.com/stoplightio/prism/master/install | sh
```

Note, the binaries do _not_ auto-update, so you will need to run it again to install new versions.

## Docker

Prism is available as a Docker Image as well under the `3` tag.

```bash
docker run --init --rm -p 4010:4010 stoplight/prism:3 mock -h 0.0.0.0 api.oas3.yml
```

If the specification you want to mock is on your computer, you'll need to mount the directory where the file resides as a volume

```bash
docker run --init --rm -p 4010:4010 -v $(pwd):/tmp stoplight/prism:3 mock -h 0.0.0.0 "/tmp/api.oas3.yml"
```
