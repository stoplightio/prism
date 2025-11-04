FROM golang:1-alpine AS nodeprune

RUN go install -trimpath -ldflags "-s -w" github.com/tj/node-prune@latest

###############################################################
FROM node:18 AS compiler

WORKDIR /usr/src/prism

COPY package.json yarn.lock /usr/src/prism/
COPY packages/ /usr/src/prism/packages/

RUN yarn && yarn build

###############################################################
FROM node:18 AS dependencies

WORKDIR /usr/src/prism/

COPY --from=nodeprune /go/bin/node-prune /bin/

COPY package.json /usr/src/prism/
RUN mkdir -p /usr/src/prism/node_modules

COPY packages/core/package.json /usr/src/prism/packages/core/
RUN mkdir -p /usr/src/prism/packages/core/node_modules

COPY packages/http/package.json /usr/src/prism/packages/http/
RUN mkdir -p /usr/src/prism/packages/http/node_modules

COPY packages/http-server/package.json /usr/src/prism/packages/http-server/
RUN mkdir -p /usr/src/prism/packages/http-server/node_modules

COPY packages/cli/package.json /usr/src/prism/packages/cli/
RUN mkdir -p /usr/src/prism/packages/cli/node_modules

ENV NODE_ENV=production
RUN yarn --production

RUN node-prune

###############################################################
FROM node:18-alpine

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
RUN apk add --no-cache tini

WORKDIR /usr/src/prism
ARG BUILD_TYPE=development
ENV NODE_ENV=production

COPY package.json /usr/src/prism/
COPY packages/core/package.json /usr/src/prism/packages/core/
COPY packages/http/package.json /usr/src/prism/packages/http/
COPY packages/http-server/package.json /usr/src/prism/packages/http-server/
COPY packages/cli/package.json /usr/src/prism/packages/cli/

COPY --from=compiler /usr/src/prism/packages/core/dist /usr/src/prism/packages/core/dist
COPY --from=compiler /usr/src/prism/packages/http/dist /usr/src/prism/packages/http/dist
COPY --from=compiler /usr/src/prism/packages/http-server/dist /usr/src/prism/packages/http-server/dist
COPY --from=compiler /usr/src/prism/packages/cli/dist /usr/src/prism/packages/cli/dist

COPY --from=dependencies /usr/src/prism/node_modules/ /usr/src/prism/node_modules/
COPY --from=dependencies /usr/src/prism/packages/core/node_modules/ /usr/src/prism/packages/core/node_modules/
COPY --from=dependencies /usr/src/prism/packages/http/node_modules/ /usr/src/prism/packages/http/node_modules/
COPY --from=dependencies /usr/src/prism/packages/http-server/node_modules/ /usr/src/prism/packages/http-server/node_modules/
COPY --from=dependencies /usr/src/prism/packages/cli/node_modules/ /usr/src/prism/packages/cli/node_modules/

WORKDIR /usr/src/prism/packages/cli/

RUN if [ "$BUILD_TYPE" = "development" ] ; then \
    cd /usr/src/prism/packages/core && yarn link && \
    cd /usr/src/prism/packages/http && yarn link @stoplight/prism-core && yarn link && \
    cd /usr/src/prism/packages/http-server && yarn link @stoplight/prism-core && yarn link @stoplight/prism-http && yarn link && \
    cd /usr/src/prism/packages/cli && yarn link @stoplight/prism-core && yarn link @stoplight/prism-http && yarn link @stoplight/prism-http-server && yarn link ; \
fi

EXPOSE 4010

ENTRYPOINT [ "/sbin/tini", "--", "node", "dist/index.js" ]
