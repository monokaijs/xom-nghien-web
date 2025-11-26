ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

ENV NODE_ENV="production"

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package-lock.json package.json ./
RUN npm install
COPY . .
RUN npx next build --experimental-build-mode compile
RUN npm prune --omit=dev


FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "npm", "run", "start" ]
