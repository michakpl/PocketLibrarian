FROM node:25-alpine

WORKDIR /app

# Install pnpm (corepack is not bundled by default in Node 25)
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Source is mounted at runtime by Tilt — no COPY needed here

EXPOSE 3000

RUN chown -R 1000:1000 /app
USER 1000

CMD ["pnpm", "dev"]
