FROM node:12 as compiler

WORKDIR /usr/src/prism

COPY package.json yarn.lock /usr/src/prism/
COPY packages/ /usr/src/prism/packages/

# To remove as soon as jsonpath dependency points to npm package (currently, it's a git dependency)
RUN apt install git

RUN yarn && yarn build

###############################################################
FROM node:12 as dependencies

WORKDIR /usr/src/prism/packages/cli/

COPY packages/cli/package.json ./package.json
COPY yarn.lock ./yarn.lock

RUN npm install tsconfig-paths \
  && npm install globby

ENV NODE_ENV production
RUN yarn

###############################################################
FROM node:12-alpine

WORKDIR /usr/src/prism

COPY --from=compiler /usr/src/prism/packages/ /usr/src/prism/packages/
COPY --from=dependencies /usr/src/prism/packages/cli/ /usr/src/prism/packages/cli/

WORKDIR /usr/src/prism/packages/cli/

ENTRYPOINT [ "node", "-r", "tsconfig-paths/register", "bin/run" ]
