ARG NODE_VERSION=25-alpine

FROM node:${NODE_VERSION} AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.pnpm-store \
    npm install -g pnpm && \
    pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder

ARG NEXT_PUBLIC_AZURE_CLIENT_ID
ARG NEXT_PUBLIC_API_SCOPE_BASE
ARG NEXT_PUBLIC_APP_URL

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production
ENV NEXT_PUBLIC_AZURE_CLIENT_ID=${NEXT_PUBLIC_AZURE_CLIENT_ID}
ENV NEXT_PUBLIC_API_SCOPE_BASE=${NEXT_PUBLIC_API_SCOPE_BASE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm install -g pnpm && \
    pnpm run build

FROM node:${NODE_VERSION} AS runner

ARG NEXT_PUBLIC_AZURE_CLIENT_ID
ARG NEXT_PUBLIC_API_SCOPE_BASE
ARG NEXT_PUBLIC_APP_URL

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_AZURE_CLIENT_ID=${NEXT_PUBLIC_AZURE_CLIENT_ID}
ENV NEXT_PUBLIC_API_SCOPE_BASE=${NEXT_PUBLIC_API_SCOPE_BASE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next
RUN chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]