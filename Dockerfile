FROM node:24 AS compiler

WORKDIR /usr/src/prism

COPY package.json package-lock.json /usr/src/prism/
COPY packages/ /usr/src/prism/packages/

RUN npm ci && npm run build

###############################################################
FROM node:24 AS dependencies

WORKDIR /usr/src/prism/

COPY package.json package-lock.json /usr/src/prism/
RUN mkdir -p /usr/src/prism/node_modules

COPY packages/core/package.json /usr/src/prism/packages/core/
RUN mkdir -p /usr/src/prism/packages/core/node_modules

COPY packages/http/package.json /usr/src/prism/packages/http/
RUN mkdir -p /usr/src/prism/packages/http/node_modules

COPY packages/http-server/package.json /usr/src/prism/packages/http-server/
RUN mkdir -p /usr/src/prism/packages/http-server/node_modules

COPY packages/cli/package.json /usr/src/prism/packages/cli/
RUN mkdir -p /usr/src/prism/packages/cli/node_modules

ENV NODE_ENV production
RUN npm ci --omit=dev

RUN if [ $(uname -m) != "aarch64" ]; then curl -sfL https://gobinaries.com/tj/node-prune | bash; fi
RUN if [ $(uname -m) != "aarch64" ]; then node-prune; fi

###############################################################
FROM node:24-alpine

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
RUN apk add --no-cache tini

WORKDIR /usr/src/prism
ARG BUILD_TYPE=development
ENV NODE_ENV production

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
    cd /usr/src/prism/packages/core && npm link && \
    cd /usr/src/prism/packages/http && npm link @stoplight/prism-core && npm link && \
    cd /usr/src/prism/packages/http-server && npm link @stoplight/prism-core && npm link @stoplight/prism-http && npm link && \
    cd /usr/src/prism/packages/cli && npm link @stoplight/prism-core && npm link @stoplight/prism-http && npm link @stoplight/prism-http-server && npm link ; \
fi

EXPOSE 4010

ENTRYPOINT [ "/sbin/tini", "--", "node", "dist/index.js" ]
