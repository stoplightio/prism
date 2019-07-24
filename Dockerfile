FROM node:12 as compiler

WORKDIR /usr/src/prism

COPY package.json yarn.lock /usr/src/prism/
COPY packages/ /usr/src/prism/packages/

RUN yarn && yarn build

###############################################################
FROM node:12 as dependencies

WORKDIR /usr/src/prism/

COPY package.json /usr/src/prism/
COPY packages/core/package.json /usr/src/prism/packages/core/
COPY packages/http/package.json /usr/src/prism/packages/http/
COPY packages/http-server/package.json /usr/src/prism/packages/http-server
COPY packages/cli/package.json /usr/src/prism/packages/cli/

ENV NODE_ENV production
RUN yarn --production

RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash
RUN ./bin/node-prune

###############################################################
FROM node:12-alpine

WORKDIR /usr/src/prism
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
COPY --from=dependencies /usr/src/prism/packages/cli/node_modules/ /usr/src/prism/packages/cli/node_modules/

WORKDIR /usr/src/prism/packages/cli/

EXPOSE 4010

ENTRYPOINT [ "node", "dist/index.js" ]
