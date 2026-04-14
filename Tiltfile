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
