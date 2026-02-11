FROM oven/bun:debian

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk git ca-certificates bash sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/server

# Copy source code
COPY content /opt/server/content
COPY webclient /opt/server/webclient
COPY engine /opt/server/engine
COPY gateway /opt/server/gateway
COPY sdk /opt/sdk

# Install engine deps and build
WORKDIR /opt/server/engine
RUN cp .env.example .env && \
    echo "BUILD_VERIFY_PACK=false" >> .env && \
    echo "BUILD_VERIFY=false" >> .env && \
    echo "BUILD_VERIFY_FOLDER=false" >> .env && \
    echo "EASY_STARTUP=true" >> .env && \
    bun install && \
    sed -i 's/port: Environment.WEB_PORT,/port: Environment.WEB_PORT, hostname: "0.0.0.0",/' src/web/index.ts && \
    bun run build

# Build webclient (standard + bot)
WORKDIR /opt/server/webclient
RUN bun install && bun run build && \
    mkdir -p /opt/server/engine/public/client /opt/server/engine/public/bot && \
    cp out/standard/client.js /opt/server/engine/public/client/client.js && \
    cp out/bot/client.js /opt/server/engine/public/bot/client.js

# Install gateway deps and patch
WORKDIR /opt/server/gateway
RUN bun install && \
    sed -i 's/port: GATEWAY_PORT,/port: GATEWAY_PORT, hostname: "0.0.0.0",/' gateway.ts

WORKDIR /opt/server

EXPOSE 8080/tcp
EXPOSE 43594/tcp
EXPOSE 7780/tcp

# Entrypoint script
COPY --chmod=755 <<'EOF' /opt/server/entrypoint.sh
#!/bin/bash
set -e

# Create data directory
mkdir -p /opt/server/data/players

# Symlink db.sqlite to persistent volume
if [ ! -L /opt/server/engine/db.sqlite ]; then
    rm -f /opt/server/engine/db.sqlite
    ln -s /opt/server/data/db.sqlite /opt/server/engine/db.sqlite
fi

# Run migrations
echo "Running database migrations..."
cd /opt/server/engine && bun run sqlite:migrate || true

# Create symlink for player saves
mkdir -p /opt/server/engine/data
if [ ! -L /opt/server/engine/data/players ]; then
    rm -rf /opt/server/engine/data/players
    ln -s /opt/server/data/players /opt/server/engine/data/players
fi

# Start gateway service
echo "Starting gateway service on port 7780..."
cd /opt/server/gateway && bun run gateway.ts &

# Start game server with verification disabled
echo "Starting game server..."
cd /opt/server/engine
export BUILD_VERIFY_PACK=false
export BUILD_VERIFY=false
export BUILD_VERIFY_FOLDER=false
exec bun run src/app.ts
EOF

CMD ["/opt/server/entrypoint.sh"]
