FROM node:20 AS base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

FROM base AS installer

COPY . .

RUN npm ci

RUN npx turbo prune @tabletop-arena/tictactoe-svelte --docker

FROM base AS builder

COPY --from=installer /usr/src/app/out/json/ .
RUN npm ci
# RUN npm ci --only=production

COPY --from=installer /usr/src/app/out/full/ .
RUN npm run build

FROM base as runner

RUN mkdir -p /usr/local/app
WORKDIR /usr/local/app

RUN addgroup --system --gid 1001 tabletop-arena
RUN adduser --system --uid 1001 tictactoe-svelte
USER tictactoe-svelte

COPY --from=builder --chown=tabletop-arena:tictactoe-svelte /usr/src/app .

EXPOSE 9001

WORKDIR /usr/local/app/apps/tictactoe-svelte

CMD [ "npm", "start" ]
