# PocketLibrarian — local dev with Tilt + Docker Compose
#
# Prerequisites:
#   brew install tilt
#   docker desktop running
#
# Usage:
#   tilt up

docker_compose('docker-compose.yml')

# Override the compose build so Tilt controls image rebuilds.
# Watches src/ and the solution file; ignores bin/obj for speed.
docker_build(
    'pocketlibrarian-api',
    context='.',
    dockerfile='src/PocketLibrarian.API/Dockerfile',
    only=[
        'src/',
        'PocketLibrarian.slnx',
    ],
    ignore=[
        '**/bin/',
        '**/obj/',
    ],
)

dc_resource(
    'db',
    labels=['database'],
)

dc_resource(
    'redis',
    labels=['cache'],
)

dc_resource(
    'api',
    labels=['backend'],
    resource_deps=['db', 'redis'],
)

docker_build(
    'pocketlibrarian-web',
    context='./web',
    dockerfile='./web/Dockerfile.dev',
    only=[
        'app/',
        'public/',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'next.config.ts',
        'tsconfig.json',
        'postcss.config.mjs',
        'eslint.config.mjs',
    ],
    live_update=[
        sync('./web/public', '/app/public'),
    ],
)

dc_resource(
    'web',
    labels=['frontend'],
    resource_deps=['api'],
    links=['http://localhost:3000'],
)
